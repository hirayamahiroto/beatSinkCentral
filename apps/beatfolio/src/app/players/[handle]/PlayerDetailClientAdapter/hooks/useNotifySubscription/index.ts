import { useState } from "react";

export const useNotifySubscription = ({
  onSubscribe,
}: {
  onSubscribe: (email: string) => void;
}) => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const submit = () => {
    onSubscribe(email);
    setEmail("");
    setSubscribed(true);
  };

  return { email, setEmail, subscribed, submit };
};
