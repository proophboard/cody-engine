
// tslint:disable-next-line:no-var-requires
import {CodyConfig} from "@proophboard/cody-server/lib/src/config/codyconfig";
import codyServer from "@proophboard/cody-server/lib/src/server";

const codyConfig: CodyConfig = require(__dirname + '/../codyconfig');

if(!codyConfig) {
  console.error("No codyconfig.ts found in the current working directory: " + process.cwd());
  process.exit(1);
}

const server = codyServer(codyConfig);

const port = process.env.PORT || 3311;

server.listen( port, () => {
  console.log( 'Server listening at port %d', port );
} );

process.on( 'SIGTERM', () => {
  console.log( 'Received SIGTERM, shutting down server' );
  server.close();
  process.exit( 0 );
});
