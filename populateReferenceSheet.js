const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const orderItems = [
  { part_number: '130163', description: 'Elbow 3/4" Copper 90° PRSF', vendor: 'Emco Plumbing', source: 'Pick up' },
  { part_number: '390042010', description: 'EXTENDED PIPE STAY 3/4"', vendor: 'Master', source: 'Order' },
  { part_number: '5406007', description: 'Drain fitting - 3/4" x 90° PVC Sch40 Elbow', vendor: 'Master', source: 'Order' },
  { part_number: '421005015', description: 'Welded Steel Nipple, 1/2" x 1-1/2"', vendor: 'Master', source: 'Order' },
  { part_number: '390041007', description: '', vendor: 'Master', source: 'Order' },
  { part_number: '421007015', description: 'Welded Steel Nipple, 3/4" Male x 1-1/2" Male', vendor: 'Master', source: 'Order' },
  { part_number: '196022', description: 'IPEX 2" x 90° PVC Extra Long Elbow H x H System 636', vendor: 'Master', source: 'Order' },
  { part_number: '713001', description: 'Tube 3/4" L Hard Copper 12\' Length', vendor: 'Emco Plumbing', source: 'Pick up' },
  { part_number: '130175', description: '', vendor: 'Emco Plumbing', source: 'Pick up' },
  { part_number: '130147', description: '', vendor: 'Emco Plumbing', source: 'Pick up' },
  { part_number: '130118', description: 'Adapter 3/4" Press PRSF-FIP', vendor: 'Emco Plumbing', source: 'Pick up' },
  { part_number: '421007030', description: 'BLACK NIPPLE FITTING 3/4 X 3"', vendor: 'Master', source: 'Order' },
  { part_number: '421005030', description: 'Welded Steel Nipple, 1/2" x 3"', vendor: 'Master', source: 'Order' },
  { part_number: '390042007', description: 'EXTENDED PIPE STAY 1/2', vendor: 'Master', source: 'Order' },
  { part_number: '9020701', description: 'Insulation 3/4"CU x 1/2"W Tundra 6\' Length', vendor: 'Emco Plumbing', source: 'Pick up' },
  { part_number: '5436007', description: 'Drain fitting - 3/4" PVC Sch40 Male Adapter', vendor: 'Master', source: 'Order' },
  { part_number: '5417007', description: 'Drain fitting - 3/4" x 45° PVC Sch40 Elbow', vendor: 'Master', source: 'Order' },
  { part_number: '5410007', description: 'Drain fitting - 3/4" PVC Sch40 Slip x MPT 90º Street Elbow', vendor: 'Master', source: 'Order' },
  { part_number: 'TRUCKSTOCK50', description: 'Small truck stock items such as fasteners, wiring conduits and connectors, drain fittings, pipe straps, tapes, insulation, glues, sealants, spray foam, nitrogen pressure tests, nitrogen purging, brazing materials, etc.', vendor: 'Master', source: 'Truck Stock' },
  { part_number: 'BV2103ECGA', description: 'PROP. BALL VALVE 3/4FPTCGA', vendor: 'Master', source: 'Order' },
  { part_number: 'MIVKTLW', description: 'Rinnai Plumbing Installation Valve Kit, Threaded', vendor: 'Master', source: 'Order' },
  { part_number: 'BV2103DCGA', description: 'GAS BALL VALVE 1/2" X 1/2" FPT EXTERIOR', vendor: 'Master', source: 'Order' },
  { part_number: '130104', description: 'Adapter 3/4" Press PRSF-MIP', vendor: 'Emco Plumbing', source: 'Pick up' },
  { part_number: 'APPPERMIT', description: 'APPPERMIT', vendor: 'Technicial Safety', source: 'Permit' },
  { part_number: '196242I', description: 'Ipex PVC S636 Short Elbow, 45°, 2"', vendor: 'Master', source: 'Order' },
  { part_number: 'RX199IN', description: 'Tankless water heater', vendor: 'Master', source: 'Order' },
  { part_number: 'NC1W', description: 'Acidic condensate neutralizer', vendor: 'Master', source: 'Order' },
  { part_number: '1000118290', description: 'Alexandria Moulding 5/8-inch x 24-inch x 48-inch Melamine White Handy Panel', vendor: 'Home Depot', source: 'Pick up' },
  { part_number: '451094007', description: 'Black Iron FIP Union, 3/4" NPT x 3/4" NPT', vendor: 'Master', source: 'Order' },
  { part_number: '451047007', description: 'Black Iron FIP Cap, 3/4" NPT', vendor: 'Master', source: 'Order' },
  { part_number: '451047005', description: 'BLACK CAP 1/2"', vendor: 'Master', source: 'Order' },
  { part_number: '451029101', description: '', vendor: 'Master', source: 'Order' },
  { part_number: '451006005', description: 'BLACK ELBOW 90D 1/2"', vendor: 'Master', source: 'Order' },
  { part_number: '451001005', description: 'Black Iron Tee, 1/2" x 1/2" x 1/2"', vendor: 'Master', source: 'Order' },
  { part_number: '9567228', description: 'Natural gas regulator', vendor: 'Master', source: 'Order' },
  { part_number: '196216', description: 'IPEX 2" PVC FGV Face Plate Assembly - Rectangle System 636', vendor: 'Master', source: 'Order' },
  { part_number: '194000', description: 'Vent pipe - Ipex PVC Gas Vent Pipe, 2" x 10\', 65°C', vendor: 'Master', source: 'Order' },
  { part_number: '5401', description: 'Drain pipe PIPE 10\' X 3/4" PVC', vendor: 'Master', source: 'Order' }
];

async function populateReferenceSheet() {
  const batch = db.batch();
  
  orderItems.forEach((item, index) => {
    const docRef = db.collection('reference_sheet').doc(`item_${index}`);
    batch.set(docRef, item);
  });

  await batch.commit();
  console.log('Reference sheet populated successfully');
}

populateReferenceSheet().catch(error => {
  console.error('Error populating reference sheet:', error);
  process.exit(1);
});