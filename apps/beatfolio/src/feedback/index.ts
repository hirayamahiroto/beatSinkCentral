export type Recovery =
  | { kind: "retry" }
  | { kind: "reauth" }
  | { kind: "navigate"; to: string; label: string }
  | { kind: "none" };

export type Feedback = {
  message: string;
  recovery: Recovery;
};
