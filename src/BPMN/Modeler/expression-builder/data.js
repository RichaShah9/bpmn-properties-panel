const combinators = [
  { name: "and", title: "AND" },
  { name: "or", title: "OR" },
  { name: "equal", title: "EQUAL" },
  { name: "notEqual", title: "NOT EQUAL" },
  { name: "greaterThan", title: "GREATER THAN" },
  { name: "greaterOrEqual", title: "GREATER OR EQUAL" },
  { name: "lessThan", title: "LESS THAN" },
  { name: "lessOrEqual", title: "LESS OR EQUAL" },
];

const combinator = [
  { name: "and", title: "AND" },
  { name: "or", title: "OR" },
];

const compare_operators = [
  "equal",
  "notEqual",
  "greaterThan",
  "greaterOrEqual",
  "lessThan",
  "lessOrEqual",
];

const map_combinator = {
  and: "&&",
  or: "||",
  equal: "==",
  notEqual: "!=",
  greaterThan: ">",
  greaterOrEqual: ">=",
  lessThan: "<",
  lessOrEqual: "<=",
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

const operators_by_type = {
  enum: ["=", "!=", "isNull", "isNotNull"],
  text: ["notLike", "isNull", "isNotNull"], //like
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
  compare_operators,
  combinators,
  map_operator_bpm,
  map_bpm_combinator,
};
