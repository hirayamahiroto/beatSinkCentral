import type { Exact } from "../../../utils/exact";
import type { CapabilitiesSlice } from "../../capabilities";

type MaybeInput<Input> = [Input] extends [void] ? [] : [input: Input];

export const defineUsecase =
  <Caps extends CapabilitiesSlice, Output, Input = void>(
    impl: (caps: Caps, ...input: MaybeInput<Input>) => Promise<Output>,
  ) =>
  <C extends Caps>(
    caps: Exact<Caps, C>,
    ...input: MaybeInput<Input>
  ): Promise<Output> =>
    impl(caps, ...input);
