import React, { useState, useEffect } from "react";
import moment from "moment";
import { IconButton, TextField, Avatar } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { ArrowForward, Clear } from "@material-ui/icons";

import { getInfo } from "../../../../../services/api";
import { COLORS } from "../../../constants";
import { getComments, addComment, removeComment } from "../../../extra";
const useStyles = makeStyles((theme) => ({
  root: {
    height: "100%",
    overflow: "hidden",
  },
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    fontSize: 14,
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  divider: {
    marginTop: 15,
    borderTop: "1px dotted #ccc",
  },
  comments: {
    height: "calc(100% - 100px)",
    overflow: "auto",
  },
  textField: {
    width: "100%",
  },
  reply: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  button: {
    border: "1px solid #58B423",
    borderRadius: 4,
    marginLeft: 10,
  },
  small: {
    width: theme.spacing(4),
    height: theme.spacing(4),
  },
}));

const avatarColor = {};

const getColor = () => {
  let no = Math.round(Math.random() * 10) % COLORS.length;
  let values = Object.values(avatarColor) || [];
  if (values.includes(COLORS[no])) {
    if (values.length === COLORS.length || values.includes("gray")) {
      return "gray";
    }
    getColor();
  } else {
    return COLORS[no];
  }
};

const getAvatarColor = (id) => {
  if (avatarColor[id]) return avatarColor[id];
  let color = getColor();
  if (color) {
    return (avatarColor[id] = color);
  }
};

export default function Comments({
  element,
  index,
  label,
  updateCommentsCount,
}) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(null);
  const [user, setUser] = useState(null);
  const classes = useStyles();

  const getCommentGroups = (comments) => {
    const groups = comments.reduce((groups, game) => {
      const date = game[1];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(game);
      return groups;
    }, {});
    return groups;
  };

  const addNewComment = () => {
    addComment(
      element,
      user,
      moment().format("DD/MM/YYYY"),
      moment().format("HH.mm"),
      comment
    );
    let comments = getComments(element);
    setComments(getCommentGroups(comments));
    setComment("");
    updateCommentsCount(true);
  };

  const removeNewComment = (element, comment) => {
    removeComment(element, comment);
    let comments = getComments(element);
    setComments(getCommentGroups(comments));
    updateCommentsCount(false);
  };

  const renderKey = (key) => {
    if (key === moment().format("DD/MM/YYYY")) {
      return "Today";
    } else if (key === moment().subtract(1, "days").format("DD/MM/YYYY")) {
      return "Yesterday";
    } else {
      return key;
    }
  };

  useEffect(() => {
    async function getUser() {
      const info = await getInfo();
      setUser((info && info["user.name"]) || "");
    }
    getUser();
  }, []);

  useEffect(() => {
    let comments = getComments(element);
    setComments(getCommentGroups(comments));
  }, [element]);

  return (
    <div className={classes.root}>
      <React.Fragment>
        {index > 0 && <div className={classes.divider} />}
        <div className={classes.groupLabel}>{label}</div>
      </React.Fragment>
      <div className={classes.root}>
        <div className={classes.comments}>
          {comments &&
            Object.entries(comments).map(([key, value]) => (
              <div key={key}>
                <div className={classes.label}>{renderKey(key)}</div>
                <div>
                  {value &&
                    value.length > 0 &&
                    value.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          margin: "10px 0px",
                        }}
                      >
                        <div style={{ marginRight: 10 }}>
                          <Avatar
                            className={classes.small}
                            style={{
                              background: getAvatarColor(
                                c && c[0] && c[0].charAt(0)
                              ),
                            }}
                          >
                            {c && c[0] && c[0].charAt(0)}
                          </Avatar>
                        </div>
                        <div style={{ width: "100%" }}>
                          <div>
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <div
                                style={{
                                  fontWeight: "bold",
                                  fontSize: 14,
                                  marginRight: 20,
                                }}
                              >
                                {c && c[0]}
                              </div>
                              <div style={{ color: "#999" }}>
                                {c && c[2] && c[2].replace(".", ":")}
                              </div>
                            </div>
                            <div>{c && c[3]}</div>
                          </div>
                        </div>
                        <div>
                          <IconButton
                            size="small"
                            onClick={() => removeNewComment(element, c)}
                          >
                            <Clear fontSize="small" />
                          </IconButton>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
        <div className={classes.reply}>
          <TextField
            label="Reply..."
            variant="outlined"
            className={classes.textField}
            onChange={(e) => setComment(e.target.value)}
            value={comment}
            size="small"
          />
          <IconButton
            size="small"
            className={classes.button}
            onClick={addNewComment}
          >
            <ArrowForward fontSize="large" style={{ color: "#58B423" }} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
