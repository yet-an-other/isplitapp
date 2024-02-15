import { Box, Skeleton } from "@mui/material";
import TextField from "@mui/material/TextField/TextField";
import styled from "@mui/material/styles/styled";
import React, { ReactElement } from "react";
import { NumericFormat, NumericFormatProps } from "react-number-format";
import { Link } from "react-router-dom";

export const AdaptiveInput = styled(TextField)(({theme}) => ({

    [theme.breakpoints.only("xs")]: {
        "& .MuiInputBase-root": {
            height: 38,
        },
        "& .MuiInputLabel-root": {
            margin: "0 auto",
            position: "absolute",
            right: "0",
            left: "-10px",
            top: "-10px",
        },
        "& .MuiInputLabel-shrink": {
            margin: "0 auto",
            position: "absolute",
            right: "0",
            left: "0",
            top: "0",
        }
    },
}));

export const RouterLink = styled(Link)(({theme})=>({
    "&:visited, &:link": {
        color: theme.palette.secondary.main,
    }
}))

export const Fade = styled('span')(({theme}) =>({
    color: theme.palette.text.disabled
}))

export const Accent = styled('span')(({theme}) =>({
    color: theme.palette.primary.main,
    fontWeight: "bold"
}))

interface InputNumberProps {
    onChange: (event: { target: { name: string; value: string } }) => void;
    name: string;
  }

export  const FloatFormatCustom = React.forwardRef<NumericFormatProps, InputNumberProps>(
    function NumericFormatCustom(props, ref) {
      const { onChange, ...other } = props;
  
      return (
        <NumericFormat
          {...other}
          getInputRef={ref}
          onValueChange={(values) => {
            onChange({
              target: {
                name: props.name,
                value: values.value,
              },
            });
          }}
          thousandSeparator
          valueIsNumericString
          allowLeadingZeros = {false}
          allowNegative = {false}
          decimalScale={2} 
        />
      );
    },
  );

export  const IntFormatCustom = React.forwardRef<NumericFormatProps, InputNumberProps>(
  function NumericFormatCustom(props, ref) {
    const { onChange, ...other } = props;

    return (
      <NumericFormat
        {...other}
        getInputRef={ref}
        onValueChange={(values) => {
          onChange({
            target: {
              name: props.name,
              value: values.value,
            },
          });
        }}
        thousandSeparator
        valueIsNumericString
        allowLeadingZeros = {false}
        allowNegative = {false}
        decimalScale={0} 
      />
    );
  },
);

interface LodingContentProps {
    isLoading: boolean
    children: React.ReactNode
}
export const LoadingPartyContent = ({ isLoading, children }: LodingContentProps): ReactElement => {

    return (
        isLoading 
            ? <Box sx={{ mt: 5 }}>
                <Skeleton variant="rectangular" height={20} sx={{ my: 1, width: '50%' }} />
                <Skeleton variant="rectangular" height={20} sx={{ my: 1}} />
                <Skeleton variant="rectangular" height={20} sx={{ my: 1, width: '90%'}} />
                <Skeleton variant="rectangular" height={20} sx={{ my: 1}} />
              </Box>
            : <>{children}</>
    )
}