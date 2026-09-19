"use client";

import {
  OfferEditor,
  type OfferEditorValues,
} from "@ui/design-system/components/organisms/OfferEditor";
import { useSaveOffer } from "./hooks/useSaveOffer";
import { toSaveOfferRequest } from "./toSaveOfferRequest";

type Props = {
  offer: OfferEditorValues | null;
};

export const OfferEditorClientAdapter = ({ offer }: Props) => {
  const { save, isLoading, error } = useSaveOffer();

  return (
    <OfferEditor
      defaultValues={offer}
      isLoading={isLoading}
      error={error}
      onSubmit={async (values) => {
        await save(toSaveOfferRequest(values));
      }}
    />
  );
};
