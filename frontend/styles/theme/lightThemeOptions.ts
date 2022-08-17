import { responsiveFontSizes, Theme, ThemeOptions } from "@mui/material/styles";
import { colors, createTheme } from "@mui/material";
declare module "@mui/material/styles/createPalette" {
  interface Palette {
    kakao?: Palette["primary"];
    smallVideo?: Palette["primary"];
  }
  interface PaletteOptions {
    kakao?: PaletteOptions["primary"];
    smallVideo?: Palette["primary"];
  }
}
// Extend color prop on components
declare module "@mui/material/Button" {
  export interface ButtonPropsColorOverrides {
    kakao: true;
  }
}

declare module "@mui/material/styles/createTheme" {
  interface Theme extends CustomTheme {}
  interface ThemeOptions extends CustomTheme {}
}
interface PaletteColor {
  light?: string;
  main: string;
  dark?: string;
  contrastText?: string;
}

type CustomThemeOptions = {
  palette: {
    [key: string]: PaletteColor;
  };
};

type CustomTheme = {
  [Key in keyof CustomThemeOptions]: CustomThemeOptions[Key];
};

const themeOptions = createTheme({
  palette: {
    mode: "light",
    kakao: {
      main: "#fee500",
      dark: "#fee500",
      light: "#fee500",
      contrastText: "#fee500",
    },
  },
});
const {
  breakpoints,
  typography: { pxToRem },
} = themeOptions;
const _theme = {
  ...themeOptions,

  overrides: {
    MuiTypography: {
      h1: {
        fontSize: "5rem",
        [breakpoints.down("xs")]: {
          fontSize: "1rem",
        },
      },
    },
  },
};
export default _theme;
