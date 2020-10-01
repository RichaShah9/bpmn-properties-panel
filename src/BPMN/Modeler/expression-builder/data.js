const combinator = [
  { name: "and", title: "AND" },
  { name: "or", title: "OR" },
];

const map_combinator = {
  and: "&&",
  or: "||",
};

const expressionType = [
  // { name: "JS", title: "JS" },
  { name: "GROOVY", title: "GROOVY" },
];

const join_operator = {
  JS: ".",
  GROOVY: "?.",
};

const dateFormat = {
  date: "DD/MM/YYYY",
  time: "LT",
  datetime: "DD/MM/YYYY h:mm a",
};

const operators_by_type = {
  enum: ["=", "!=", "isNull", "isNotNull"],
  text: ["notLike", "isNull", "isNotNull"], //like
  string: ["=", "!=", "isNull", "isNotNull"], //'like', 'notLike',
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
  in: "in",
  notIn: "in",
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
};
