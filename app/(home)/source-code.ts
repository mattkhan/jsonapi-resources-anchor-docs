export const commentType = `import type { Post } from "./Post.model.ts";
import type { Reaction } from "./Reaction.model.ts";
import type { User } from "./User.model.ts";

type Comment = {
  id: number;
  type: "comments";
  text: string;
  /** Reason the author left a comment. */
  reason: "approval" | "disapproval" | "feedback" | null;
  anonymous: boolean;
  spiciness: 1 | 2 | 3 | 4 | 5;
  uninferrable: unknown;
  relationships: {
    /** Author of the comment. */
    user: User | null;
    reactions: Reaction[];
    commentable: Post | User;
  }
};

export { type Comment };`;

export const commentResource = `class CommentResource < ApplicationResource
  attribute :text
  attribute :reason
  attribute :anonymous, Anchor::Types::Boolean
  attribute :spiciness, Anchor::Types::Union.new((1..5).map { |v| Anchor::Types::Literal.new(v) })
  attribute :uninferrable

  relationship :user, to: :one, description: "Author of the comment."
  relationship :reactions, to: :many
  relationship :commentable, polymorphic: true, to: :one

  def anonymous = @model.user_id?
  def spiciness = rand(1..5)
  def uninferrable = nil
end`;

export const commentSchema = `class Comment < ActiveRecord::Base
  belongs_to :user, optional: true
  belongs_to :commentable, polymorphic: true 
  has_many :reactions

  enum :reason, { approval: "approval", disapproval: "disapproval", feedback: "feedback" }
end

ActiveRecord::Schema[8.0].define(version: 2025_10_11_000738) do
  create_table "comments", force: :cascade do |t|
    t.string "text", null: false
    t.string "reason", comment: "Reason the author left a comment."
    t.string "commentable_type"
    t.bigint "commentable_id"
    t.bigint "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["commentable_type", "commentable_id"], name: "index_comments_on_commentable"
    t.index ["user_id"], name: "index_comments_on_user_id"
  end
end`;

export const commentResourceDos = `class ApplicationResource < JSONAPI::Resource
  include Anchor::SchemaSerializable
  abstract
end

class CommentResource < ApplicationResource
  attribute :anonymous, Anchor::Types::Boolean
  attribute :spiciness, Anchor::Types::Union.new((1..5).map { |v| Anchor::Types::Literal.new(v) })

  def anonymous = @model.user_id?
  def spiciness = rand(1..5)
end`;
