import { useEffect, useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head'
import Link from 'next/link'
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiUser } from "react-icons/fi";

import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const formattedPosts = postsPagination.results.map((post: Post) => {
    return {
      uid: post.uid,
      data: post.data,
      first_publication_date: format(new Date(post.first_publication_date), "dd MMM yyyy", { locale: ptBR, })
    }
  });


  const [posts, setPosts] = useState<Post[]>(formattedPosts);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const handleFetchPosts = async () => {
    const postsResponse = await fetch(nextPage)
      .then(resp => resp.json())

    setNextPage(postsResponse.next_page);

    const newPosts = postsResponse.results.map((post: Post) => {
      return {
        uid: post.uid,
        data: post.data,
        first_publication_date: format(new Date(post.first_publication_date), "dd MMM yyyy", { locale: ptBR, })
      }
    });

    setPosts([...posts, ...newPosts]);
  }

  return (
    <>
      <Head>
        <title>Posts | News</title>
      </Head>

      <main className={commonStyles.container}>
        <Header />

        <div className={styles.posts}>
          {
            posts.map(post => (
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a>
                  <strong>{post.data.title}</strong>

                  <p>{post.data.subtitle}</p>

                  <div>
                    <time>
                      <FiCalendar />
                      {post.first_publication_date}
                    </time>

                    <span>
                      <FiUser />
                      {post.data.author}
                    </span>
                  </div>
                </a>
              </Link>
            ))
          }
        </div>

        {
          nextPage &&
          <button
            className={styles.button}
            onClick={handleFetchPosts}
            type="button"
          >
            Carregar mais posts
          </button>
        }
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});

  const postsResponse = await prismic.getByType<any>('posts', {
    pageSize: 20
  });

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
    }
  })

  const postsPagination = {
    next_page: postsResponse.next_page,
    results,
  }

  return {
    props: {
      postsPagination,
    },
    revalidate: 60 * 30,
  }
};
