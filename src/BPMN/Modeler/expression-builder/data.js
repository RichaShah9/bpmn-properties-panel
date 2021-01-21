const combinator = [
  { name: "and", title: "AND" },
  { name: "or", title: "OR" },
];

const map_combinator = {
  and: "&&",
  or: "||",
};

const map_bpm_combinator = {
  and: "and",
  or: "or",
};

const expressionType = [
  // { name: "JS", title: "JS" },
  { name: "GROOVY", title: "GROOVY" },
];

const join_operator = {
  JS: ".",
  GROOVY: "?.",
  BPM: ".",
};

const dateFormat = {
  date: "DD/MM/YYYY",
  time: "LT",
  datetime: "DD/MM/YYYY h:mm a",
};

const positive_operators = [
  "=",
  ">=",
  "<=",
  ">",
  "<",
  "like",
  "isNull",
  "between",
  "contains",
  "in",
  "isTrue",
];

const operators_by_type = {
  enum: ["=", "!=", "isNull", "isNotNull"],
  text: ["like", "notLike", "isNull", "isNotNull"],
  integer: [
    "=",
    "!=",
    ">=",
    "<=",
    ">",
    "<",
    "between",
    "notBetween",
    "isNull",
    "isNotNull",
  ],
  boolean: ["isTrue", "isFalse"],
};

const map_operator_groovy = {
  "=": "==",
  "!=": "!=",
  ">": ">",
  ">=": ">=",
  "<": "<",
  "<=": "<=",
  isNotNull: "!= null",
  isNull: "== null",
  isTrue: "==",
  isFalse: "==",
  in: "contains",
  notIn: "contains",
  like: "contains",
  notLike: "contains",
  contains: "contains",
  notContains: "contains",
};

const map_operator_bpm = {
  "=": "=",
  "!=": "!=",
  ">": ">",
  ">=": ">=",
  "<": "<",
  "<=": "<=",
  isNotNull: "is NOT NULL",
  isNull: "is NULL",
  isTrue: "is",
  isFalse: "is",
  in: "IN",
  notIn: "NOT IN",
  like: "LIKE",
  notLike: "NOT LIKE",
  contains: "MEMBER OF",
  notContains: "NOT MEMBER OF",
};

const map_operator_js = {
  "=": "===",
  "!=": "!==",
  ">": ">",
  ">=": ">=",
  "<": "<",
  "<=": "<=",
  in: "in",
  notIn: "in",
  like: "LIKE",
  notLike: "NOT LIKE",
  isNotNull: "!== null",
  isNull: "=== null",
  isTrue: "===",
  isFalse: "===",
};

const map_operator = {
  JS: map_operator_js,
  GROOVY: map_operator_groovy,
  BPM: map_operator_bpm,
};

const operators = [
  { name: "=", title: "equals" },
  { name: "!=", title: "not equal" },
  { name: ">", title: "greater than" },
  { name: ">=", title: "greater or equal" },
  { name: "<", title: "less than" },
  { name: "<=", title: "less or equal" },
  { name: "in", title: "in" },
  { name: "between", title: "between" },
  { name: "notBetween", title: "not Between" },
  { name: "notIn", title: "not in" },
  { name: "isNull", title: "is null" },
  { name: "isNotNull", title: "is not null" },
  { name: "like", title: "contains" },
  { name: "notLike", title: "doesn't contain" },
  { name: "isTrue", title: "is true" },
  { name: "isFalse", title: "is false" },
  { name: "contains", title: "contains" },
  { name: "notContains", title: "not contains" },
];

export {
  combinator,
  expressionType,
  operators,
  operators_by_type,
  map_operator,
  map_combinator,
  dateFormat,
  join_operator,
  map_operator_bpm,
  map_bpm_combinator,
  positive_operators,
};
