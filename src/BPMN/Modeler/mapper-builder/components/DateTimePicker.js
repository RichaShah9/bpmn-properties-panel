import React, { useState } from "react";
import MomentUtils from "@date-io/moment";
import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDateTimePicker,
  KeyboardDatePicker,
} from "@material-ui/pickers";
import { DATE_FORMAT } from "../constant";

const PICKERS = {
  date: KeyboardDatePicker,
  time: KeyboardTimePicker,
  datetime: KeyboardDateTimePicker,
};

function DateTimePicker({ inline, type = "date", ...props }) {
  const [open, setOpen] = useState(false);
  let valueRef = React.useRef();
  const { name, title, format, error, onChange, ...other } = props;
  const Picker = PICKERS[type];

  function onKeyDown(e) {
    if (e.keyCode === 40) setOpen(true);
  }

  function onClose() {
    onChange(valueRef.current);
    setOpen(false);
  }

  React.useEffect(() => {
    if(open) {
      valueRef.current = other.value;  
    }
  }, [open, other.value])

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <Picker
        autoOk={true}
        open={open}
        ampm={false}
        views={
          type === "date"
            ? ["date"]
            : type === "datetime"
            ? ["date", "hours", "minutes"]
            : type === "time"
            ? ["hours", "minutes", "seconds"]
            : ["date"]
        }
        onChange={(value) => {
          valueRef.current = value;
          onChange(value);
        }}
        PopoverProps={{
          anchorOrigin: { vertical: "bottom", horizontal: "left" },
          transformOrigin: { vertical: "top", horizontal: "left" },
        }}
        disableToolbar
        variant="inline"
        {...(inline ? { invalidDateMessage: "" } : {})}
        style={{ width: "100%", ...(inline ? { margin: 0 } : {}) }}
        label={inline ? "" : title}
        format={format || DATE_FORMAT[type]}
        {...(type !== "time" ? { animateYearScrolling: false } : {})}
        {...other}
        onKeyDown={onKeyDown}
        onClose={onClose}
        onOpen={() => setOpen(true)}
      />
    </MuiPickersUtilsProvider>
  );
}

export default DateTimePicker;
