


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."update_leads_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_leads_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."apartment_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "alt_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."apartment_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."apartments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "building" "text",
    "unit" "text",
    "layout" "text",
    "area_m2" numeric(6,2),
    "floor" integer,
    "owner_id" "uuid",
    "status" "text" DEFAULT 'available'::"text" NOT NULL,
    "for_sale" boolean DEFAULT false NOT NULL,
    "for_rent" boolean DEFAULT false NOT NULL,
    "in_rental_program" boolean DEFAULT false NOT NULL,
    "features" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "base_price_cents" integer DEFAULT 250000 NOT NULL,
    "max_guests" integer DEFAULT 4 NOT NULL,
    "ical_export_token" "text" DEFAULT ("gen_random_uuid"())::"text",
    "description" "text",
    "orientation" "text",
    "rooms" "jsonb",
    "subtitle" "text",
    CONSTRAINT "apartments_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'reserved'::"text", 'sold'::"text"])))
);


ALTER TABLE "public"."apartments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid",
    "action" "text" NOT NULL,
    "old_data" "jsonb",
    "new_data" "jsonb",
    "actor_role" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blocked_dates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "owner_id" "uuid",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "reason" "text" DEFAULT 'owner_use'::"text" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text" DEFAULT 'owner'::"text" NOT NULL,
    "external_uid" "text",
    "channel_connection_id" "uuid",
    CONSTRAINT "blocked_dates_dates_check" CHECK (("end_date" >= "start_date")),
    CONSTRAINT "blocked_dates_reason_check" CHECK (("reason" = ANY (ARRAY['owner_use'::"text", 'maintenance'::"text", 'other'::"text"]))),
    CONSTRAINT "blocked_dates_source_check" CHECK (("source" = ANY (ARRAY['owner'::"text", 'booking_com'::"text", 'airbnb'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."blocked_dates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "sender_role" "text" NOT NULL,
    "sender_name" "text",
    "content" "text" NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "booking_messages_sender_role_check" CHECK (("sender_role" = ANY (ARRAY['guest'::"text", 'admin'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."booking_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "guest_first_name" "text" NOT NULL,
    "guest_last_name" "text" NOT NULL,
    "guest_email" "text" NOT NULL,
    "guest_phone" "text",
    "guests_count" integer DEFAULT 1 NOT NULL,
    "check_in" "date" NOT NULL,
    "check_out" "date" NOT NULL,
    "nights" integer NOT NULL,
    "total_amount_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'CZK'::"text" NOT NULL,
    "payment_method" "text" DEFAULT 'bank_transfer'::"text" NOT NULL,
    "stripe_checkout_session_id" "text",
    "stripe_payment_intent_id" "text",
    "paid_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "confirmation_token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(16), 'hex'::"text") NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "checkin_info" "jsonb",
    CONSTRAINT "bookings_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['bank_transfer'::"text", 'stripe'::"text"]))),
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."channel_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "channel" "text" NOT NULL,
    "label" "text",
    "ical_url" "text" NOT NULL,
    "sync_enabled" boolean DEFAULT true NOT NULL,
    "last_synced_at" timestamp with time zone,
    "last_sync_count" integer,
    "last_sync_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "channel_connections_channel_check" CHECK (("channel" = ANY (ARRAY['booking_com'::"text", 'airbnb'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."channel_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "apartment_slug" "text",
    "apartment_title" "text",
    "source_url" "text",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "message" "text",
    "preferred_dates" "text",
    "guest_count" integer,
    "gdpr_consent" boolean DEFAULT false NOT NULL,
    "terms_accepted" boolean DEFAULT false NOT NULL,
    "marketing_consent" boolean DEFAULT false,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "notes" "text",
    "language" "text" DEFAULT 'cs'::"text",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "leads_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'in_progress'::"text", 'closed'::"text", 'spam'::"text"]))),
    CONSTRAINT "leads_type_check" CHECK (("type" = ANY (ARRAY['rent_inquiry'::"text", 'sale_inquiry'::"text", 'investment_inquiry'::"text", 'investment_share_request'::"text", 'general_inquiry'::"text"])))
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maintenance_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text" NOT NULL,
    "admin_note" "text",
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "maintenance_requests_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'urgent'::"text"]))),
    CONSTRAINT "maintenance_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'resolved'::"text"])))
);


ALTER TABLE "public"."maintenance_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owner_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "apartment_id" "uuid",
    "category" "text" DEFAULT 'other'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size_bytes" integer,
    "mime_type" "text",
    "uploaded_by" "text" DEFAULT 'admin'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "owner_documents_category_check" CHECK (("category" = ANY (ARRAY['purchase_contract'::"text", 'handover_protocol'::"text", 'insurance'::"text", 'other'::"text"]))),
    CONSTRAINT "owner_documents_uploaded_by_check" CHECK (("uploaded_by" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))
);


ALTER TABLE "public"."owner_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owner_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "invited_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL
);


ALTER TABLE "public"."owner_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" DEFAULT ''::"text" NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    "phone" "text",
    "bank_account" "text",
    "commission_rate" numeric(5,4),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."owners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "price_per_night_cents" integer NOT NULL,
    "min_nights" integer DEFAULT 2,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pricing_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."svj_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."svj_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."svj_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text" DEFAULT 'other'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size_bytes" integer,
    "mime_type" "text",
    "uploaded_by" "uuid",
    "is_admin_upload" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "svj_documents_category_check" CHECK (("category" = ANY (ARRAY['stanovy'::"text", 'zapisy'::"text", 'finance'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."svj_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."svj_poll_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "option_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."svj_poll_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."svj_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid",
    "type" "text" DEFAULT 'announcement'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "is_pinned" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "options" "jsonb",
    "poll_deadline" timestamp with time zone,
    "archived_at" timestamp with time zone,
    CONSTRAINT "svj_posts_type_check" CHECK (("type" = ANY (ARRAY['announcement'::"text", 'discussion'::"text", 'poll'::"text", 'document'::"text"])))
);


ALTER TABLE "public"."svj_posts" OWNER TO "postgres";


ALTER TABLE ONLY "public"."apartment_images"
    ADD CONSTRAINT "apartment_images_apartment_id_storage_path_key" UNIQUE ("apartment_id", "storage_path");



ALTER TABLE ONLY "public"."apartment_images"
    ADD CONSTRAINT "apartment_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."apartments"
    ADD CONSTRAINT "apartments_ical_export_token_key" UNIQUE ("ical_export_token");



ALTER TABLE ONLY "public"."apartments"
    ADD CONSTRAINT "apartments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."apartments"
    ADD CONSTRAINT "apartments_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blocked_dates"
    ADD CONSTRAINT "blocked_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_messages"
    ADD CONSTRAINT "booking_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_confirmation_token_key" UNIQUE ("confirmation_token");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."channel_connections"
    ADD CONSTRAINT "channel_connections_apartment_id_channel_key" UNIQUE ("apartment_id", "channel");



ALTER TABLE ONLY "public"."channel_connections"
    ADD CONSTRAINT "channel_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owner_documents"
    ADD CONSTRAINT "owner_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owner_invitations"
    ADD CONSTRAINT "owner_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_rules"
    ADD CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."svj_comments"
    ADD CONSTRAINT "svj_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."svj_documents"
    ADD CONSTRAINT "svj_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."svj_poll_votes"
    ADD CONSTRAINT "svj_poll_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."svj_poll_votes"
    ADD CONSTRAINT "svj_poll_votes_post_id_owner_id_key" UNIQUE ("post_id", "owner_id");



ALTER TABLE ONLY "public"."svj_posts"
    ADD CONSTRAINT "svj_posts_pkey" PRIMARY KEY ("id");



CREATE INDEX "apartment_images_apartment_idx" ON "public"."apartment_images" USING "btree" ("apartment_id", "sort_order");



CREATE INDEX "apartments_owner_id_idx" ON "public"."apartments" USING "btree" ("owner_id");



CREATE INDEX "apartments_slug_idx" ON "public"."apartments" USING "btree" ("slug");



CREATE INDEX "blocked_dates_apartment_idx" ON "public"."blocked_dates" USING "btree" ("apartment_id");



CREATE INDEX "blocked_dates_dates_idx" ON "public"."blocked_dates" USING "btree" ("apartment_id", "start_date", "end_date");



CREATE INDEX "blocked_dates_external_uid_idx" ON "public"."blocked_dates" USING "btree" ("channel_connection_id", "external_uid") WHERE ("external_uid" IS NOT NULL);



CREATE INDEX "booking_messages_booking_id_idx" ON "public"."booking_messages" USING "btree" ("booking_id");



CREATE INDEX "booking_messages_created_at_idx" ON "public"."booking_messages" USING "btree" ("booking_id", "created_at");



CREATE INDEX "bookings_apartment_id_idx" ON "public"."bookings" USING "btree" ("apartment_id");



CREATE INDEX "bookings_dates_idx" ON "public"."bookings" USING "btree" ("apartment_id", "check_in", "check_out");



CREATE INDEX "bookings_guest_email_idx" ON "public"."bookings" USING "btree" ("guest_email");



CREATE INDEX "bookings_status_idx" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "bookings_token_idx" ON "public"."bookings" USING "btree" ("confirmation_token");



CREATE INDEX "idx_leads_created_at" ON "public"."leads" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_leads_email" ON "public"."leads" USING "btree" ("email");



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "idx_leads_type" ON "public"."leads" USING "btree" ("type");



CREATE INDEX "maintenance_owner_id_idx" ON "public"."maintenance_requests" USING "btree" ("owner_id");



CREATE INDEX "maintenance_status_idx" ON "public"."maintenance_requests" USING "btree" ("status");



CREATE INDEX "owner_documents_owner_id_idx" ON "public"."owner_documents" USING "btree" ("owner_id");



CREATE INDEX "owner_invitations_email_idx" ON "public"."owner_invitations" USING "btree" ("email");



CREATE INDEX "owner_invitations_owner_id_idx" ON "public"."owner_invitations" USING "btree" ("owner_id");



CREATE INDEX "owners_email_idx" ON "public"."owners" USING "btree" ("email");



CREATE INDEX "owners_user_id_idx" ON "public"."owners" USING "btree" ("user_id");



CREATE INDEX "svj_comments_created_at_idx" ON "public"."svj_comments" USING "btree" ("created_at");



CREATE INDEX "svj_comments_post_id_idx" ON "public"."svj_comments" USING "btree" ("post_id");



CREATE INDEX "svj_documents_category_idx" ON "public"."svj_documents" USING "btree" ("category");



CREATE INDEX "svj_posts_archived_at_idx" ON "public"."svj_posts" USING "btree" ("archived_at");



CREATE INDEX "svj_posts_created_at_idx" ON "public"."svj_posts" USING "btree" ("created_at" DESC);



CREATE INDEX "svj_posts_type_idx" ON "public"."svj_posts" USING "btree" ("type");



CREATE OR REPLACE TRIGGER "leads_updated_at" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."update_leads_updated_at"();



ALTER TABLE ONLY "public"."apartment_images"
    ADD CONSTRAINT "apartment_images_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."apartments"
    ADD CONSTRAINT "apartments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."blocked_dates"
    ADD CONSTRAINT "blocked_dates_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blocked_dates"
    ADD CONSTRAINT "blocked_dates_channel_connection_id_fkey" FOREIGN KEY ("channel_connection_id") REFERENCES "public"."channel_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blocked_dates"
    ADD CONSTRAINT "blocked_dates_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_messages"
    ADD CONSTRAINT "booking_messages_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."channel_connections"
    ADD CONSTRAINT "channel_connections_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owner_documents"
    ADD CONSTRAINT "owner_documents_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."owner_documents"
    ADD CONSTRAINT "owner_documents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owner_invitations"
    ADD CONSTRAINT "owner_invitations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pricing_rules"
    ADD CONSTRAINT "pricing_rules_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."svj_comments"
    ADD CONSTRAINT "svj_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."owners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."svj_comments"
    ADD CONSTRAINT "svj_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."svj_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."svj_documents"
    ADD CONSTRAINT "svj_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."owners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."svj_poll_votes"
    ADD CONSTRAINT "svj_poll_votes_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."svj_poll_votes"
    ADD CONSTRAINT "svj_poll_votes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."svj_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."svj_posts"
    ADD CONSTRAINT "svj_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."owners"("id") ON DELETE SET NULL;



CREATE POLICY "Anyone can insert leads" ON "public"."leads" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Service role can manage leads" ON "public"."leads" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."apartment_images" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "apartment_images_public_read" ON "public"."apartment_images" FOR SELECT USING (true);



ALTER TABLE "public"."apartments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "apartments_owner_read" ON "public"."apartments" FOR SELECT USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



CREATE POLICY "apartments_public_read" ON "public"."apartments" FOR SELECT USING ((("for_sale" = true) OR ("for_rent" = true)));



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blocked_dates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blocked_dates_delete_own" ON "public"."blocked_dates" FOR DELETE USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



CREATE POLICY "blocked_dates_insert_own" ON "public"."blocked_dates" FOR INSERT WITH CHECK (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



CREATE POLICY "blocked_dates_select_all" ON "public"."blocked_dates" FOR SELECT USING (true);



CREATE POLICY "blocked_dates_select_own" ON "public"."blocked_dates" FOR SELECT USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."booking_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bookings_owner_select" ON "public"."bookings" FOR SELECT USING (("apartment_id" IN ( SELECT "a"."id"
   FROM ("public"."apartments" "a"
     JOIN "public"."owners" "o" ON (("o"."id" = "a"."owner_id")))
  WHERE ("o"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."channel_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "maintenance_insert_own" ON "public"."maintenance_requests" FOR INSERT WITH CHECK (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."maintenance_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "maintenance_select_own" ON "public"."maintenance_requests" FOR SELECT USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."owner_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owner_documents_insert_own" ON "public"."owner_documents" FOR INSERT WITH CHECK ((("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))) AND ("uploaded_by" = 'owner'::"text")));



CREATE POLICY "owner_documents_select_own" ON "public"."owner_documents" FOR SELECT USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."owner_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."owners" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owners_select_own" ON "public"."owners" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."pricing_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pricing_rules_select_published" ON "public"."pricing_rules" FOR SELECT USING (true);



ALTER TABLE "public"."svj_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svj_comments_delete_own" ON "public"."svj_comments" FOR DELETE USING (("author_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



CREATE POLICY "svj_comments_insert_own" ON "public"."svj_comments" FOR INSERT WITH CHECK (("author_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



CREATE POLICY "svj_comments_select_owners" ON "public"."svj_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."owners"
  WHERE (("owners"."user_id" = "auth"."uid"()) AND ("owners"."is_active" = true)))));



ALTER TABLE "public"."svj_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svj_documents_select_owners" ON "public"."svj_documents" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."owners"
  WHERE (("owners"."user_id" = "auth"."uid"()) AND ("owners"."is_active" = true)))));



ALTER TABLE "public"."svj_poll_votes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svj_poll_votes_delete_own" ON "public"."svj_poll_votes" FOR DELETE USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



CREATE POLICY "svj_poll_votes_insert_own" ON "public"."svj_poll_votes" FOR INSERT WITH CHECK (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



CREATE POLICY "svj_poll_votes_select" ON "public"."svj_poll_votes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."owners"
  WHERE (("owners"."user_id" = "auth"."uid"()) AND ("owners"."is_active" = true)))));



CREATE POLICY "svj_poll_votes_update_own" ON "public"."svj_poll_votes" FOR UPDATE USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."svj_posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svj_posts_select_owners" ON "public"."svj_posts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."owners"
  WHERE (("owners"."user_id" = "auth"."uid"()) AND ("owners"."is_active" = true)))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_leads_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_leads_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_leads_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."apartment_images" TO "anon";
GRANT ALL ON TABLE "public"."apartment_images" TO "authenticated";
GRANT ALL ON TABLE "public"."apartment_images" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."apartments" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."apartments" TO "authenticated";
GRANT ALL ON TABLE "public"."apartments" TO "service_role";



GRANT SELECT("id") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("id") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("slug") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("slug") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("building") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("building") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("unit") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("unit") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("layout") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("layout") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("area_m2") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("area_m2") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("floor") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("floor") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("owner_id") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("status") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("status") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("for_sale") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("for_sale") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("for_rent") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("for_rent") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("in_rental_program") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("in_rental_program") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("features") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("features") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("created_at") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("created_at") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("updated_at") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("updated_at") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("title") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("title") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("base_price_cents") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("base_price_cents") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("max_guests") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("max_guests") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("description") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("description") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("orientation") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("orientation") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("rooms") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("rooms") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("subtitle") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("subtitle") ON TABLE "public"."apartments" TO "authenticated";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."blocked_dates" TO "anon";
GRANT ALL ON TABLE "public"."blocked_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."blocked_dates" TO "service_role";



GRANT ALL ON TABLE "public"."booking_messages" TO "anon";
GRANT ALL ON TABLE "public"."booking_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_messages" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."channel_connections" TO "anon";
GRANT ALL ON TABLE "public"."channel_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."channel_connections" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."maintenance_requests" TO "anon";
GRANT ALL ON TABLE "public"."maintenance_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance_requests" TO "service_role";



GRANT ALL ON TABLE "public"."owner_documents" TO "anon";
GRANT ALL ON TABLE "public"."owner_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."owner_documents" TO "service_role";



GRANT ALL ON TABLE "public"."owner_invitations" TO "anon";
GRANT ALL ON TABLE "public"."owner_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."owner_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."owners" TO "anon";
GRANT ALL ON TABLE "public"."owners" TO "authenticated";
GRANT ALL ON TABLE "public"."owners" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_rules" TO "anon";
GRANT ALL ON TABLE "public"."pricing_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_rules" TO "service_role";



GRANT ALL ON TABLE "public"."svj_comments" TO "anon";
GRANT ALL ON TABLE "public"."svj_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."svj_comments" TO "service_role";



GRANT ALL ON TABLE "public"."svj_documents" TO "anon";
GRANT ALL ON TABLE "public"."svj_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."svj_documents" TO "service_role";



GRANT ALL ON TABLE "public"."svj_poll_votes" TO "anon";
GRANT ALL ON TABLE "public"."svj_poll_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."svj_poll_votes" TO "service_role";



GRANT ALL ON TABLE "public"."svj_posts" TO "anon";
GRANT ALL ON TABLE "public"."svj_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."svj_posts" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";









-- ═══ Doplněno 30. 10. 2026: struktura z migrací 012–014, které jsou novější než dump z 9. 10. ═══
-- Nový dump z lokálního stacku nejde (DB host jen IPv6, kontejner v Colimě IPv6 neumí).
-- Jen DDL: seed běží jako dávka a UPDATE by se kontroloval dřív, než tabulka vznikne.
-- Shodu s produkcí ověřuje os/qa/parity.sh.

-- ─── 012_fdm_integration.sql ───
ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS fdm_room_use_id int UNIQUE;
CREATE TABLE IF NOT EXISTS public.fdm_calendar (
  apartment_id uuid NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  date date NOT NULL,
  available boolean NOT NULL DEFAULT false,
  price_cents int,                       -- Standard Rate, v měně currency
  currency text NOT NULL DEFAULT 'EUR',
  min_stay int,                          -- MinStayArrival z FDM restrictions
  closed boolean NOT NULL DEFAULT false, -- Closed / ClosedOnArrival
  synced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (apartment_id, date)
);
ALTER TABLE public.fdm_calendar ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.fdm_calendar TO service_role;
REVOKE ALL ON public.fdm_calendar FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS fdm_calendar_date_idx ON public.fdm_calendar (date);
CREATE TABLE IF NOT EXISTS public.fdm_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  apartments int NOT NULL DEFAULT 0,
  days int NOT NULL DEFAULT 0,
  error text
);
ALTER TABLE public.fdm_sync_log ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.fdm_sync_log TO service_role;
REVOKE ALL ON public.fdm_sync_log FROM anon, authenticated;
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS fdm_reservation_code text,
  ADD COLUMN IF NOT EXISTS fdm_guest_account_id text,
  ADD COLUMN IF NOT EXISTS fdm_sync_status text NOT NULL DEFAULT 'skipped'
    CHECK (fdm_sync_status IN ('pending', 'synced', 'failed', 'skipped')),
  ADD COLUMN IF NOT EXISTS fdm_sync_error text,
  ADD COLUMN IF NOT EXISTS fdm_synced_at timestamptz;
CREATE INDEX IF NOT EXISTS bookings_fdm_reservation_code_idx
  ON public.bookings (fdm_reservation_code) WHERE fdm_reservation_code IS NOT NULL;

-- ─── 013_i18n_en.sql ───
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS title_en text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS subtitle_en text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS orientation_en text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS description_en text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS features_en jsonb;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'cs';
DO $$ BEGIN
  ALTER TABLE public.bookings ADD CONSTRAINT bookings_language_check CHECK (language IN ('cs', 'en'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
grant select (title_en, subtitle_en, orientation_en, description_en, features_en)
  on public.apartments to anon, authenticated;

-- ─── 014_i18n_pl.sql ───
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS title_pl text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS subtitle_pl text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS orientation_pl text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS description_pl text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS features_pl jsonb;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_language_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_language_check CHECK (language IN ('cs', 'en', 'pl'));
grant select (title_pl, subtitle_pl, orientation_pl, description_pl, features_pl)
  on public.apartments to anon, authenticated;
