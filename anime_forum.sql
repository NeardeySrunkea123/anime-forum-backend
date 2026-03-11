--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

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

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: anime; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.anime (
    uuid uuid NOT NULL,
    title character varying(255) NOT NULL,
    poster_url character varying(255),
    status character varying(30),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    core_anime_id integer
);


ALTER TABLE public.anime OWNER TO postgres;

--
-- Name: forums; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forums (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    slug character varying(100) NOT NULL,
    icon character varying(50),
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.forums OWNER TO postgres;

--
-- Name: forums_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.forums_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.forums_id_seq OWNER TO postgres;

--
-- Name: forums_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.forums_id_seq OWNED BY public.forums.id;


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_likes (
    id integer NOT NULL,
    post_id integer,
    user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.post_likes OWNER TO postgres;

--
-- Name: post_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.post_likes_id_seq OWNER TO postgres;

--
-- Name: post_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_likes_id_seq OWNED BY public.post_likes.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    thread_id integer,
    user_id integer,
    content text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    parent_post_id integer,
    edited_at timestamp without time zone
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.posts_id_seq OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: threads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.threads (
    id integer NOT NULL,
    forum_id integer,
    user_id integer,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    content text NOT NULL,
    views integer DEFAULT 0,
    is_pinned boolean DEFAULT false,
    is_locked boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    replies_count integer DEFAULT 0,
    last_reply_at timestamp without time zone,
    deleted_at timestamp without time zone,
    anime_uuid uuid,
    anime_id integer,
    core_anime_id integer,
    anime_title_snapshot character varying(255),
    anime_description_snapshot text,
    anime_image_snapshot text
);


ALTER TABLE public.threads OWNER TO postgres;

--
-- Name: threads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.threads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.threads_id_seq OWNER TO postgres;

--
-- Name: threads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.threads_id_seq OWNED BY public.threads.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    avatar_url character varying(255),
    bio text,
    role character varying(20) DEFAULT 'user'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: forums id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forums ALTER COLUMN id SET DEFAULT nextval('public.forums_id_seq'::regclass);


--
-- Name: post_likes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes ALTER COLUMN id SET DEFAULT nextval('public.post_likes_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: threads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.threads ALTER COLUMN id SET DEFAULT nextval('public.threads_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: anime; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.anime (uuid, title, poster_url, status, created_at, updated_at, core_anime_id) FROM stdin;
11111111-1111-1111-1111-111111111111	Naruto	https://example.com/posters/naruto.jpg	completed	2026-01-28 16:43:13.858443+07	2026-01-28 16:43:13.858443+07	2
22222222-2222-2222-2222-222222222222	One Piece	https://example.com/posters/onepiece.jpg	ongoing	2026-01-28 16:43:13.858443+07	2026-01-28 16:43:13.858443+07	3
33333333-3333-3333-3333-333333333333	Attack on Titan	https://example.com/posters/aot.jpg	completed	2026-01-28 16:43:13.858443+07	2026-01-28 16:43:13.858443+07	1
44444444-4444-4444-4444-444444444444	Jujutsu Kaisen	https://example.com/posters/jjk.jpg	ongoing	2026-01-28 16:43:13.858443+07	2026-01-28 16:43:13.858443+07	4
55555555-5555-5555-5555-555555555555	Demon Slayer	https://example.com/posters/demonslayer.jpg	ongoing	2026-01-28 16:43:13.858443+07	2026-01-28 16:43:13.858443+07	5
7e5b5e0d-722a-4857-ab31-2785ad470c7e	Look Back	data:image	ongoing	2026-01-29 00:14:03.593283+07	2026-01-29 00:14:03.593283+07	6
c7e1916b-0f44-41dc-b8d2-b4f5aaae9d56	Shingeki no Kyojin Season 2	https://cdn.myanimelist.net/images/anime/4/84177l.jpg	\N	2026-03-01 13:59:52.480375+07	2026-03-01 13:59:52.480375+07	12
fcacfa21-238e-41b7-94a2-ed8de846c02a	Violet Evergarden	https://cdn.myanimelist.net/images/anime/1795/95088l.jpg	\N	2026-03-01 14:00:17.163067+07	2026-03-01 14:00:17.163067+07	46
ef337c7a-b206-4b36-9fbc-185fab49b1ed	Naruto: Shippuuden	https://cdn.myanimelist.net/images/anime/1565/111305l.jpg	\N	2026-03-01 14:26:55.073643+07	2026-03-01 14:26:55.073643+07	15
fe0f9298-f569-4a8f-8859-1eb745086456	One Piece	https://cdn.myanimelist.net/images/anime/1244/138851l.jpg	\N	2026-03-01 14:26:58.209688+07	2026-03-01 14:26:58.209688+07	17
abd099bc-c3af-4f60-a498-4a3dd9edccd9	Shigatsu wa Kimi no Uso	https://cdn.myanimelist.net/images/anime/1405/143284l.jpg	\N	2026-03-01 21:44:22.870171+07	2026-03-01 21:44:22.870171+07	24
\.


--
-- Data for Name: forums; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.forums (id, name, description, slug, icon, display_order, is_active, created_at, updated_at) FROM stdin;
1	General Discussion	Talk about anime, characters, and episodes.	general-discussion	message-circle	1	t	2026-03-12 01:15:45.9998	2026-03-12 01:15:45.9998
2	Recommendations	Ask for and share anime recommendations.	recommendations	star	2	t	2026-03-12 01:15:45.9998	2026-03-12 01:15:45.9998
3	Reviews	Share your review and rating of anime series.	reviews	pen-square	3	t	2026-03-12 01:15:45.9998	2026-03-12 01:15:45.9998
4	Anime News	Latest anime news, announcements, and updates.	anime-news	newspaper	4	t	2026-03-12 01:15:45.9998	2026-03-12 01:15:45.9998
5	Off Topic	Talk about manga, games, and anything else.	off-topic	coffee	5	t	2026-03-12 01:15:45.9998	2026-03-12 01:15:45.9998
6	General Discussion	Talk about anime	general	\N	0	t	2026-03-12 01:16:17.934694	2026-03-12 01:16:17.934694
8	News	Anime news	news	\N	0	t	2026-03-12 01:16:17.934694	2026-03-12 01:16:17.934694
\.


--
-- Data for Name: post_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_likes (id, post_id, user_id, created_at) FROM stdin;
1	1	1	2026-03-12 01:15:46.003089
2	1	2	2026-03-12 01:15:46.003089
3	2	1	2026-03-12 01:15:46.003089
4	2	3	2026-03-12 01:15:46.003089
5	3	3	2026-03-12 01:15:46.003089
6	3	4	2026-03-12 01:15:46.003089
7	4	2	2026-03-12 01:15:46.003089
8	5	5	2026-03-12 01:15:46.003089
9	6	2	2026-03-12 01:15:46.003089
10	7	4	2026-03-12 01:15:46.003089
11	8	1	2026-03-12 01:15:46.003089
12	9	3	2026-03-12 01:15:46.003089
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.posts (id, thread_id, user_id, content, is_active, created_at, updated_at, deleted_at, parent_post_id, edited_at) FROM stdin;
1	1	3	For me it is One Piece because of the world building and the emotional backstories.	t	2026-03-12 01:15:46.001624	2026-03-12 01:15:46.001624	\N	\N	\N
2	1	4	Attack on Titan is my favorite because the story keeps evolving in unexpected ways.	t	2026-03-12 01:15:46.001624	2026-03-12 01:15:46.001624	\N	\N	\N
3	2	2	You should watch Hunter x Hunter. It gives me a similar adventure feeling.	t	2026-03-12 01:15:46.001624	2026-03-12 01:15:46.001624	\N	\N	\N
4	2	5	Maybe try Magi too. It has a good adventure vibe.	t	2026-03-12 01:15:46.001624	2026-03-12 01:15:46.001624	\N	\N	\N
5	3	1	I agree. The animation and letter-writing concept are beautiful.	t	2026-03-12 01:15:46.001624	2026-03-12 01:15:46.001624	\N	\N	\N
6	4	2	I am really excited for sequel announcements this season.	t	2026-03-12 01:15:46.001624	2026-03-12 01:15:46.001624	\N	\N	\N
7	5	1	The basement reveal is still one of the best moments for me.	t	2026-03-12 01:15:46.001624	2026-03-12 01:15:46.001624	\N	\N	\N
8	5	3	The final season had many unforgettable scenes too.	t	2026-03-12 01:15:46.001624	2026-03-12 01:15:46.001624	\N	\N	\N
9	6	2	Naruto Ultimate Ninja Storm was one of my favorites.	t	2026-03-12 01:15:46.001624	2026-03-12 01:15:46.001624	\N	\N	\N
\.


--
-- Data for Name: threads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.threads (id, forum_id, user_id, title, slug, content, views, is_pinned, is_locked, is_active, created_at, updated_at, replies_count, last_reply_at, deleted_at, anime_uuid, anime_id, core_anime_id, anime_title_snapshot, anime_description_snapshot, anime_image_snapshot) FROM stdin;
1	1	2	Favorite Anime of All Time	favorite-anime-of-all-time	What is your favorite anime of all time and why?	120	f	f	t	2026-03-12 01:15:46.000325	2026-03-12 01:15:46.000325	0	\N	\N	\N	\N	\N	\N	\N	\N
2	2	3	Recommend me something like One Piece	recommend-me-something-like-one-piece	I love adventure, comedy, and long journeys. Any anime like One Piece?	95	t	f	t	2026-03-12 01:15:46.000325	2026-03-12 01:15:46.000325	0	\N	\N	\N	\N	\N	\N	\N	\N
3	3	5	Violet Evergarden Review	violet-evergarden-review	I just finished Violet Evergarden. Here is my review and why it is so emotional.	60	f	f	t	2026-03-12 01:15:46.000325	2026-03-12 01:15:46.000325	0	\N	\N	\N	\N	\N	\N	\N	\N
4	4	1	New Season Announcements This Month	new-season-announcements-this-month	Let’s collect all anime season announcements and release updates here.	150	t	f	t	2026-03-12 01:15:46.000325	2026-03-12 01:15:46.000325	0	\N	\N	\N	\N	\N	\N	\N	\N
5	1	4	Best Attack on Titan Moments	best-attack-on-titan-moments	Which moments from Attack on Titan gave you chills?	80	f	f	t	2026-03-12 01:15:46.000325	2026-03-12 01:15:46.000325	0	\N	\N	\N	\N	\N	\N	\N	\N
6	5	3	Best Anime Games You Played	best-anime-games-you-played	What anime-related games do you enjoy the most?	40	f	f	t	2026-03-12 01:15:46.000325	2026-03-12 01:15:46.000325	0	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, avatar_url, bio, role, is_active, created_at, updated_at) FROM stdin;
1	admin	admin@anime.com	$2b$10$yD9K8KjQWmD0x1Y7vP6i3e8rEo4A0m8w4N8iK3rN5Q6lGzM2eE8wG	https://i.pravatar.cc/150?img=1	Main administrator of the anime forum.	admin	t	2026-03-12 01:15:45.995964	2026-03-12 01:15:45.995964
2	naruto_fan	naruto@example.com	$2b$10$yD9K8KjQWmD0x1Y7vP6i3e8rEo4A0m8w4N8iK3rN5Q6lGzM2eE8wG	https://i.pravatar.cc/150?img=2	Big fan of Naruto and shonen anime.	user	t	2026-03-12 01:15:45.995964	2026-03-12 01:15:45.995964
3	luffy_gear5	luffy@example.com	$2b$10$yD9K8KjQWmD0x1Y7vP6i3e8rEo4A0m8w4N8iK3rN5Q6lGzM2eE8wG	https://i.pravatar.cc/150?img=3	Adventure anime lover.	user	t	2026-03-12 01:15:45.995964	2026-03-12 01:15:45.995964
4	mikasa_ack	mikasa@example.com	$2b$10$yD9K8KjQWmD0x1Y7vP6i3e8rEo4A0m8w4N8iK3rN5Q6lGzM2eE8wG	https://i.pravatar.cc/150?img=4	AOT discussions and theory posts.	user	t	2026-03-12 01:15:45.995964	2026-03-12 01:15:45.995964
5	violet_writer	violet@example.com	$2b$10$yD9K8KjQWmD0x1Y7vP6i3e8rEo4A0m8w4N8iK3rN5Q6lGzM2eE8wG	https://i.pravatar.cc/150?img=5	Slice of life and emotional anime fan.	user	t	2026-03-12 01:15:45.995964	2026-03-12 01:15:45.995964
7	naruto	naruto@anime.com	$2b$10$WFctDkTY7ZQEbeGd10fpcO/3pbaAzv.GLuOjV/.ZPRBAgS26MhS8G	\N	\N	user	t	2026-03-12 01:16:17.932529	2026-03-12 01:16:17.932529
8	luffy	luffy@anime.com	$2b$10$WFctDkTY7ZQEbeGd10fpcO/3pbaAzv.GLuOjV/.ZPRBAgS26MhS8G	\N	\N	user	t	2026-03-12 01:16:17.932529	2026-03-12 01:16:17.932529
\.


--
-- Name: forums_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.forums_id_seq', 8, true);


--
-- Name: post_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.post_likes_id_seq', 12, true);


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.posts_id_seq', 9, true);


--
-- Name: threads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.threads_id_seq', 6, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: anime anime_core_anime_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anime
    ADD CONSTRAINT anime_core_anime_id_key UNIQUE (core_anime_id);


--
-- Name: anime anime_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anime
    ADD CONSTRAINT anime_pkey PRIMARY KEY (uuid);


--
-- Name: forums forums_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forums
    ADD CONSTRAINT forums_pkey PRIMARY KEY (id);


--
-- Name: forums forums_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forums
    ADD CONSTRAINT forums_slug_key UNIQUE (slug);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_post_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_user_id_key UNIQUE (post_id, user_id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: threads threads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_anime_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anime_title ON public.anime USING btree (title);


--
-- Name: idx_posts_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_created ON public.posts USING btree (created_at DESC);


--
-- Name: idx_posts_thread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_thread ON public.posts USING btree (thread_id);


--
-- Name: idx_posts_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_user ON public.posts USING btree (user_id);


--
-- Name: idx_threads_anime; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_threads_anime ON public.threads USING btree (anime_id);


--
-- Name: idx_threads_anime_uuid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_threads_anime_uuid ON public.threads USING btree (anime_uuid);


--
-- Name: idx_threads_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_threads_created ON public.threads USING btree (created_at DESC);


--
-- Name: idx_threads_forum; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_threads_forum ON public.threads USING btree (forum_id);


--
-- Name: idx_threads_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_threads_user ON public.threads USING btree (user_id);


--
-- Name: forums update_forums_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_forums_updated_at BEFORE UPDATE ON public.forums FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: posts update_posts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: threads update_threads_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON public.threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_parent_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_parent_post_id_fkey FOREIGN KEY (parent_post_id) REFERENCES public.posts(id) ON DELETE SET NULL;


--
-- Name: posts posts_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id) ON DELETE CASCADE;


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: threads threads_anime_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_anime_uuid_fkey FOREIGN KEY (anime_uuid) REFERENCES public.anime(uuid) ON DELETE RESTRICT;


--
-- Name: threads threads_forum_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_forum_id_fkey FOREIGN KEY (forum_id) REFERENCES public.forums(id) ON DELETE CASCADE;


--
-- Name: threads threads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

