import * as path from "path";
import * as promptly from "promptly";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import * as helpers from "./helpers";
import * as keystore from "./keystore";

helpers.suppressFetchAPIWarning();

const args = yargs(hideBin(process.argv))
  .option("contract", {
    type: "string",
    describe: "code id of the badges hub contract",
    demandOption: true,
  })
  .option("code-id", {
    type: "number",
    describe: "code id of the badges hub contract",
    demandOption: true,
  })
  .option("network", {
    type: "string",
    describe: "the network where the codes are to be stored; must be mainnet|testnet|localhost",
    demandOption: false,
    default: "localhost",
  })
  .option("key", {
    type: "string",
    describe: "name of key to sign the txs",
    demandOption: false,
    default: "dev",
  })
  .option("key-dir", {
    type: "string",
    describe: "directories where the encrypted key files are located",
    demandOption: false,
    default: path.resolve(__dirname, "../keys"),
  })
  .wrap(100)
  .parseSync();

(async function () {
  const password = await promptly.password("enter password to decrypt the key: ");
  const key = await keystore.load(args["key"], password, args["key-dir"]);
  const { senderAddr, client } = await helpers.createSigningClient(args["network"], key);

  // TODO: make this a CLI input parameter
  const migrateMsg = {
    fee_rate: {
      metadata: "200000",
      key: "10000",
    },
  };

  process.stdout.write("migrating hub contract... ");
  const { transactionHash } = await client.migrate(
    senderAddr,
    args["contract"],
    args["code-id"],
    migrateMsg,
    "auto"
  );
  console.log("success! txhash:", transactionHash);
})();
