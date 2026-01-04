CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"scene_id" text NOT NULL,
	"player_name" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_type" text NOT NULL,
	"asset_key" text DEFAULT 'default' NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" integer NOT NULL,
	"fish_id" text NOT NULL,
	"fish_data" jsonb NOT NULL,
	"caught_at" timestamp DEFAULT now() NOT NULL,
	"caught_in" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_lower" text NOT NULL,
	"password_hash" text NOT NULL,
	"money" integer DEFAULT 0 NOT NULL,
	"pole_level" integer DEFAULT 1 NOT NULL,
	"last_scene" text DEFAULT 'pond' NOT NULL,
	"last_position_x" integer DEFAULT 5 NOT NULL,
	"last_position_y" integer DEFAULT 8 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "players_name_unique" UNIQUE("name"),
	CONSTRAINT "players_name_lower_unique" UNIQUE("name_lower")
);
--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_scene_created_idx" ON "chat_messages" USING btree ("scene_id","created_at");--> statement-breakpoint
CREATE INDEX "game_assets_type_key_idx" ON "game_assets" USING btree ("asset_type","asset_key");