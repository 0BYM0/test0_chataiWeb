

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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "conversation_type" "text" DEFAULT 'student_self_study'::"text" NOT NULL,
    "title" "text",
    "start_time" timestamp with time zone DEFAULT "now"(),
    "last_message_time" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "document_type" "text" NOT NULL,
    "category" "text" NOT NULL,
    "tags" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."knowledge_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lesson_plans" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "grade" "text" NOT NULL,
    "module" "text" NOT NULL,
    "knowledge_points" "text"[] NOT NULL,
    "duration" "text" NOT NULL,
    "teaching_preferences" "text"[],
    "teaching_objectives" "jsonb" NOT NULL,
    "key_points" "text"[] NOT NULL,
    "resources" "jsonb",
    "teaching_process" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lesson_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "sender_type" "text" NOT NULL,
    "sender_role" "text" NOT NULL,
    "receiver_type" "text",
    "receiver_role" "text",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "message_order" integer NOT NULL,
    "reference_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "username" "text" NOT NULL,
    "email" "text" NOT NULL,
    "avatar_url" "text",
    "role" "text" DEFAULT 'student'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_documents"
    ADD CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_plans"
    ADD CONSTRAINT "lesson_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_plans"
    ADD CONSTRAINT "lesson_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



CREATE POLICY "Knowledge documents are viewable by everyone" ON "public"."knowledge_documents" FOR SELECT USING (true);



CREATE POLICY "Only admins can delete knowledge documents" ON "public"."knowledge_documents" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Only admins can insert knowledge documents" ON "public"."knowledge_documents" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Only admins can update knowledge documents" ON "public"."knowledge_documents" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Users are viewable by everyone" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Users can delete their own conversations" ON "public"."conversations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own lesson plans" ON "public"."lesson_plans" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert messages to their conversations" ON "public"."messages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."conversations"
  WHERE (("conversations"."id" = "messages"."conversation_id") AND ("conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own conversations" ON "public"."conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own lesson plans" ON "public"."lesson_plans" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own conversations" ON "public"."conversations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own data" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own lesson plans" ON "public"."lesson_plans" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view messages in their conversations" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversations"
  WHERE (("conversations"."id" = "messages"."conversation_id") AND ("conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own conversations" ON "public"."conversations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own lesson plans" ON "public"."lesson_plans" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lesson_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_documents" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_documents" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_plans" TO "anon";
GRANT ALL ON TABLE "public"."lesson_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_plans" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









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






























RESET ALL;
