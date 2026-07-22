import { createApiServerClient } from "../../utils/client/index";

const client = createApiServerClient();

const res = await client.api.test.$get();

console.log(res);
