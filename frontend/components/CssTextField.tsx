import { styled, TextField } from "@mui/material";

export const InputTextField = styled(TextField)({
  " label": {
    color: "white",
    fontColor: "white",
  },
  "& label.Mui-root": {
    fontColor: "white",
  },
  "& label.Mui-focused": {
    color: "cyan",
  },
  "& .MuiInput-underline:after": {
    borderBottomColor: "cyan",
  },
  "& .MuiOutlinedInput-root": {
    color: "white",
    "& fieldset": {
      borderColor: "white",
      fontColor: "white",
    },
    "&:hover fieldset": {
      borderColor: "white",
    },
    "&.Mui-focused fieldset": {
      borderColor: "cyan",
    },
  },
});
