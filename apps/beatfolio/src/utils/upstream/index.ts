type UpstreamErrorResponse = {
  status: number;
  text: () => Promise<string>;
};

const JSON_CONTENT_TYPE = "application/json";

export const forwardUpstreamError = async (
  res: UpstreamErrorResponse,
): Promise<Response> =>
  new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": JSON_CONTENT_TYPE },
  });
