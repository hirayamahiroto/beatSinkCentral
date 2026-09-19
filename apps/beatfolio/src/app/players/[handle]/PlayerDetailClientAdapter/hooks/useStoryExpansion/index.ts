import { useState } from "react";

export const useStoryExpansion = ({ onExpand }: { onExpand: () => void }) => {
  const [expanded, setExpanded] = useState(false);

  const expand = () => {
    setExpanded(true);
    onExpand();
  };

  return { expanded, expand };
};
