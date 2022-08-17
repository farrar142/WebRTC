import { CacheProvider, EmotionCache } from "@emotion/react";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { CssBaseline, ThemeProvider, useTheme } from "@mui/material";
import { NextComponentType } from "next";
import type { AppContext, AppInitialProps, AppLayoutProps } from "next/app";
import Head from "next/head";
import React, { ReactNode } from "react";
import { RecoilRoot } from "recoil";
import "../styles/globals.css";
import lightThemeOptions from "../styles/theme/lightThemeOptions";
import createEmotionCache from "../utility/createEmotionCache";

export interface MyAppProps extends AppLayoutProps {
  emotionCache?: EmotionCache;
}

const clientSideEmotionCache = createEmotionCache();

const MyApp: NextComponentType<AppContext, AppInitialProps, AppLayoutProps> = (
  props: MyAppProps
) => {
  return (
    <RecoilRoot>
      <RecoilRenderer {...props} />
    </RecoilRoot>
  );
};
const RecoilRenderer = (props: MyAppProps) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const getLayout = Component.getLayout || ((page: ReactNode) => page);
  const theme = useTheme();
  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <title>Mussage</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {getLayout(<Component {...pageProps} />)}
      </ThemeProvider>
    </CacheProvider>
  );
};
MyApp.getInitialProps = async ({ Component, ctx }) => {
  let pageProps = {};
  // 하위 컴포넌트에 getInitialProps가 있다면 추가 (각 개별 컴포넌트에서 사용할 값 추가)
  if (Component.getInitialProps) {
    pageProps = await Component.getInitialProps(ctx);
  }

  // _app에서 props 추가 (모든 컴포넌트에서 공통적으로 사용할 값 추가)
  pageProps = { ...pageProps, posttt: { title: 11111, content: 3333 } };

  return { pageProps };
};

export default MyApp;
