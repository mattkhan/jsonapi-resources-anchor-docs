export const init = `module T
  include Anchor::Types
end

class Exhaustive < T::Object
  a_maybe = T::Maybe.new(T::String)
  an_array = T::Array.new(T::Integer)
  a_union = T::Union.new([T::String, an_array])
  some_object = T::Object.new([T::Property.new("nested", T::Boolean, true, "Another comment!")])

  property :string, T::String
  property :float, T::Float
  property :integer, T::Integer
  property :boolean, T::Boolean
  property :nil, T::Null

  property :a_maybe, a_maybe
  property :an_array, an_array
  property :a_union, a_union, optional: true,
    description: "A comment."

  property :string_literal, T::Literal.new("literal")
  property :union_of_literals, T::Union.new([T::Literal.new("lit"), T::Literal.new(1), T::Literal.new(true)])
  property :reference, T::Reference.new("Reference")
  property :some_object, some_object
  property :identity, T::Identity.new(a_maybe)
  property :unknown, T::Unknown
end

expression = Anchor::TypeScript::Serializer.type_string(Exhaustive.camelize)
"type Exhaustive = #{expression};"`;

export const prereq = `
module Anchor
  module TypeScript
    class Serializer
      class << self
        def type_string(type, depth = 1)
          case type
          when Anchor::Types::String.singleton_class then "string"
          when Anchor::Types::BigDecimal.singleton_class then "string"
          when Anchor::Types::Float.singleton_class then "number"
          when Anchor::Types::Integer.singleton_class then "number"
          when Anchor::Types::Boolean.singleton_class then "boolean"
          when Anchor::Types::Null.singleton_class then "null"
          when Anchor::Types::Record, Anchor::Types::Record.singleton_class then "Record<string, #{type_string(type.try(:value_type) || Anchor::Types::Unknown)}>"
          when Anchor::Types::Union then type.types.map { |type| type_string(type, depth) }.join(" | ")
          when Anchor::Types::Intersection then type.types.map { |type| "(#{type_string(type, depth)})" }.join(" & ")
          when Anchor::Types::Maybe then Anchor.config.maybe_as_union ? type_string(Anchor::Types::Union.new([type.type, Anchor::Types::Null]), depth) : "Maybe<#{type_string(type.type, depth)}>"
          when Anchor::Types::Array then Anchor.config.array_bracket_notation ? "(#{type_string(type.type, depth)})[]" : "Array<#{type_string(type.type, depth)}>"
          when Anchor::Types::Literal then serialize_literal(type.value)
          when Anchor::Types::Reference then type.name
          when Anchor::Types::Object, Anchor::Types::Object.singleton_class then serialize_object(type, depth)
          when Anchor::Types::Enum.singleton_class then type.anchor_schema_name
          when Anchor::Types::Identity then type_string(type.type)
          when Anchor::Types::Unknown.singleton_class then "unknown"
          else raise RuntimeError
          end
        end

        private

        def serialize_literal(value)
          case value
          when ::String, ::Symbol then "\\"#{value}\\""
          else value.to_s
          end
        end

        def serialize_object(type, depth)
          return "{}" if type.properties.empty?
          properties = type.properties.flat_map do |p|
            [
              p.description && "/** #{p.description} */",
              "#{safe_name(p)}: #{type_string(p.type, depth + 1)};",
            ].compact
          end
          indent = " " * (depth * 2)
          properties = properties.map { |p| p.prepend(indent) }.join("\n")
          ["{", properties, "}".prepend(indent[2..])].join("\n")
        end

        def safe_name(property)
          name = property.name
          if name.match?(/[^a-zA-Z0-9_]/)
            "\\"#{name}\\""
          else
            name.to_s + (property.optional ? "?" : "")
          end
        end
      end
    end
  end
end


module Anchor
  module Types
    class String; end
    class Float; end
    class Integer; end
    class BigDecimal; end
    class Boolean; end
    class Null; end
    class Unknown; end
    Identity = Struct.new(:type)
    Record = Struct.new(:value_type)
    Maybe = Struct.new(:type)
    Array = Struct.new(:type)
    Literal = Struct.new(:value)
    Union = Struct.new(:types) do
      def |(other)
        # may need a deep dup
        self.class.new(types.map(&:dup) + [other.dup])
      end
    end
    Intersection = Struct.new(:types)
    Reference = Struct.new(:name) do
      def anchor_schema_name
        name
      end

      def |(other)
        Anchor::Types::Union.new([dup, other])
      end
    end
    Property = Struct.new(:name, :type, :optional, :description) do
      def dup(name: nil, type: nil, optional: nil, description: nil)
        self.class.new(name: name || self.name, type: type || self.type, optional: optional || self.optional, description: description || self.description)
      end
    end
    class Object
      attr_reader :properties

      def initialize(properties)
        @properties = properties || []
      end

      def keys
        properties.map(&:name)
      end

      def key?(key)
        keys.include?(key)
      end

      def [](key)
        properties.find { |property| property.name == key }
      end

      def pick(names)
        picked = properties.filter_map do |property|
          property.dup if names.include?(property.name)
        end
        self.class.new(picked)
      end

      def omit(names)
        picked = properties.filter_map do |property|
          property.dup if names.exclude?(property.name)
        end
        self.class.new(picked)
      end

      def overwrite_values(type)
        props = properties.map do |property|
          Property.new(property.name, type, property.optional, property.description)
        end
        self.class.new(props)
      end

      def overwrite_higher(other, keep_description: :right)
        intersection = properties.filter_map do |property|
          next unless other.key?(property.name)
          other_prop = other[property.name]
          desc = keep_description == :right ? other_prop.description : property.description
          Property.new(property.name, other_prop.type.new(property.type), property.optional, desc)
        end
        intersection = self.class.new(intersection)
        intersection & omit(intersection.keys) & other.omit(intersection.keys)
      end

      def overwrite(other, keep_description: :right)
        return omit(other.keys) & other if keep_description == :right

        props = properties.map do |property|
          if (x = other.properties.find { |op| op.name == property.name })
            Property.new(x.name, x.type, x.optional, property.description)
          else
            property.dup
          end
        end
        self.class.new(props)
      end

      def nonnullable
        props = properties.map do |property|
          type = property.type.is_a?(Anchor::Types::Maybe) ? property.type.type : property.type
          Property.new(property.name, type, property.optional, property.description)
        end
        self.class.new(props)
      end

      def &(other)
        # TODO: recursive intersection ? Anchor::Types::Intersection maybe ?
        self.class.new(properties.map(&:dup) + other.omit(keys).properties)
      end

      class << self
        def properties
          @properties ||= []
        end

        def property(name, type, optional: nil, description: nil)
          @properties ||= []
          @properties.push(Property.new(name, type, optional, description))
        end

        def camelize
          def helper(val)
            val = val.to_s
            vals = val.split("_")
            if vals.length == 1
              vals[0]
            else
              ([vals[0]] + vals[1..].map(&:capitalize)).join("")
            end
          end
          new(properties.map { |prop| prop.dup(name: helper(prop.name)) })
        end
      end
    end

    Relationship = Struct.new(:resource, :resources, :null, :null_elements, keyword_init: true)

    class Enum
      class << self
        attr_reader :values

        def anchor_schema_name(name = nil)
          @anchor_schema_name ||= name || default_name
        end

        def value(name, value)
          @values ||= []
          @values.push([name, Types::Literal.new(value)])
        end

        private

        def default_name
          s_name = name.split("::").last
          s_name.end_with?("Enum") ? s_name.sub(/Enum\\Z/, "") : s_name
        end
      end
    end
  end
end

module T
  include Anchor::Types
end

module Anchor
  def self.config
    f = Struct.new(:array_bracket_notation, :maybe_as_union)
    f.new(false, false)
  end
end
`;
