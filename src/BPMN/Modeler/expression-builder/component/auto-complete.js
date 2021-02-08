import React, { useEffect, useState } from "react";
import { TextField, CircularProgress } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import Autocomplete from "@material-ui/lab/Autocomplete";
import _uniqueId from "lodash/uniqueId";

import { translate } from "../../../../utils";
import { useDebounce } from "../util";

const useStyles = makeStyles((theme) => ({
  listbox: {
    maxHeight: "300px !important",
  },
}));
export default function AutoComplete(props) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [selectedValue, setSelectedValue] = useState(props.isMulti ? [] : null);
  const [inputValue, setInputValue] = useState("");
  const {
    name,
    value,
    onChange,
    options: flatOptions,
    optionLabelKey = "title",
    optionValueKey = "id",
    isMulti = false,
    title,
    fetchAPI,
    inline,
    InputProps,
    error,
    filterSelectedOptions = false,
    disableCloseOnSelect = true,
    ...other
  } = props;

  const classes = useStyles();
  const [loading, setLoading] = useState(false);

  const findOption = React.useCallback(
    (option) => {
      return (
        flatOptions &&
        flatOptions.find((i) => i && i[optionValueKey] === option.trim())
      );
    },
    [flatOptions, optionValueKey]
  );

  async function onInputChange(value = "") {
    setInputValue(value);
  }

  const delayChange = useDebounce(onInputChange, 400);

  useEffect(() => {
    let active = true;
    if (open) {
      setLoading(true);
      if (fetchAPI) {
        (async () => {
          const data = await fetchAPI({ search: inputValue });
          if (active) {
            setOptions(data);
            setLoading(false);
          }
        })();
      } else {
        setOptions(flatOptions);
        setLoading(false);
      }
    }
    return () => {
      active = false;
      setLoading(false);
    };
  }, [fetchAPI, flatOptions, inputValue, open]);

  useEffect(() => {
    if (typeof value === "string") {
      const values = value.split(",");
      setSelectedValue(
        isMulti ? values.map((v) => findOption(v)) : findOption(values[0])
      );
    } else {
      setSelectedValue(value ? value : isMulti ? [] : null);
    }
  }, [value, isMulti, findOption]);

  function onKeyDown(e) {
    if (e.key === "Backspace") {
      if (selectedValue && selectedValue[optionLabelKey] === inputValue) {
        onChange(null);
      }
    }
  }

  function handleChange(item) {
    if (typeof value === "string") {
      isMulti
        ? onChange(item.map((i) => i && i[optionValueKey]).join(",") || [])
        : onChange(item && item[optionValueKey]);
    } else {
      onChange(item);
    }
  }

  const checkValue = (option) => {
    return (option && option.type) === "metaJsonModel"
      ? `${
          option && option[optionLabelKey] ? option[optionLabelKey] : ""
        } (Custom model)` || ""
      : name === "fieldName"
      ? `${translate(option && option["title"] ? option["title"] : "")} (${
          option && option[optionLabelKey]
        })`
      : option
      ? option[optionLabelKey]
        ? option[optionLabelKey]
        : option["id"]
        ? option["id"].toString()
        : ""
      : "";
  };

  return (
    <Autocomplete
      getOptionSelected={(option, value) => {
        return isMulti
          ? option[optionValueKey] === value[optionValueKey]
          : checkValue(option) === checkValue(value);
      }}
      getOptionLabel={(option) => {
        return checkValue(option);
      }}
      loading={loading}
      id={_uniqueId("select-widget")}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={
        selectedValue
          ? isMulti
            ? Array.isArray(selectedValue)
              ? selectedValue
              : []
            : selectedValue
          : isMulti
          ? []
          : null
      }
      onChange={(event, newValue) => handleChange(newValue)}
      options={options || []}
      multiple={isMulti}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={(e, value) => delayChange(value)}
      classes={{ option: "menu-item", listbox: classes.listbox }}
      renderInput={(params) => {
        return (
          <TextField
            {...params}
            error={error}
            label={inline ? "" : title}
            fullWidth
            onClick={() => setOpen(true)}
            InputProps={{
              ...InputProps,
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? (
                    <CircularProgress
                      className={classes.circularProgress}
                      size={15}
                    />
                  ) : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
            {...(isMulti ? {} : { onKeyDown: onKeyDown })}
          />
        );
      }}
      {...(isMulti ? { disableCloseOnSelect } : {})}
      {...other}
    />
  );
}
