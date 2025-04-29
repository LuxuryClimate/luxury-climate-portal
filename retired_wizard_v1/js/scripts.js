function estimateApp() {
  return {
    page: 'estimate',
    estimates: [],
    pricebook: [],
    order: {
      jobNumber: '',
      address: '',
      installDates: '',
      siteName: '',
      sitePhone: '',
      shippingDate: '',
      deliveryDetails: '',
      deliveryName: '',
      deliveryPhone: '',
      projectAccount: 'no',
      items: []
    },
    showEditModal: false,
    editStep: 1,
    formOptions: {
      purposeOfVisit: [
        { value: "central_heat_pump", label: "Central Heat Pump" },
        { value: "dual_fuel", label: "Dual Fuel" },
        { value: "mini_split", label: "Mini Split" },
        { value: "multi_split", label: "Multi Split" },
        { value: "fireplace", label: "Fireplace" },
        { value: "furnace", label: "Furnace" },
        { value: "electric_hot_water_tank", label: "Electric Hot Water Tank" },
        { value: "gas_hot_water_tank", label: "Gas Hot Water Tank" },
        { value: "tankless_water_heater", label: "Tankless Water Heater" },
        { value: "ventilation_fan", label: "Ventilation Fan" },
        { value: "hrv", label: "Heat Recovery Ventilator (HRV)" },
        { value: "erv", label: "Energy Recovery Ventilator (ERV)" },
        { value: "geothermal", label: "Geothermal" },
        { value: "air_conditioner", label: "Air Conditioner" },
        { value: "ductwork", label: "Ductwork" },
        { value: "other", label: "Other" }
      ],
      infoBundles: [
        { value: "rebate_information", label: "Rebate Information" },
        { value: "credentials", label: "Credentials (Worksafe BC, Licenses)" },
        { value: "contractor_insurance", label: "Contractor Insurance" },
        { value: "building_penetrations_details", label: "Building Penetrations Details" },
        { value: "none", label: "None" }
      ],
      financingOptions: [
        { value: "short_term", label: "Short-Term Loan" },
        { value: "long_term", label: "Long-Term Loan" },
        { value: "low_interest", label: "Low-Interest Option" },
        { value: "other", label: "Other" }
      ],
      gasPipingIssues: [
        { value: "insufficient_capacity", label: "Insufficient Capacity" },
        { value: "needs_replacement", label: "Needs Replacement" },
        { value: "other", label: "Other" }
      ]
    },
    editForm: {
      estimate_id: '',
      customerName: '',
      siteAddress: '',
      customerId: '',
      status: '',
      purposeOfVisit: [],
      otherPurpose: '',
      rebatesResearched: '',
      espCode: '',
      infoBundles: [],
      financingInterest: '',
      financingOptions: [],
      otherFinancingOption: '',
      additions: '',
      additionsDetails: '',
      windowsInsulation: '',
      windowsInsulationDetails: '',
      mechanicalRoomLocation: '',
      gasPipingSupport: '',
      gasPipingIssues: [],
      otherGasPipingIssue: '',
      floorDrain: '',
      electricalPanelCapacity: '',
      electricalPanelIssues: '',
      draftsNoticed: '',
      draftsNoticedDetails: '',
      basementDampness: '',
      basementDampnessDetails: '',
      airPurifiers: '',
      indoorUnits: '',
      ductingCondition: '',
      ductingIssues: '',
      atticHeight: '',
      atticImage: '',
      ventilationFanLocation: '',
      outdoorUnitLocation: '',
      lidarScan: '',
      selectedSystem: '',
      estimatedInstallDays: '',
      quoteAmount: ''
    },

    async init() {
      await this.loadPricebook();
      await this.loadEstimates();
    },

    async loadPricebook() {
      try {
        const serviceCsv = loadFileData('LuxuryClimateHVACLtd_pricebook_export.csv');
        const materialCsv = loadFileData('LuxuryClimateHVACLtd_pricebook_materials_export.csv');

        // Vendor mapping from Luxury_Order_E-mail_20250327.xlsx
        const vendorMap = {
          'Master': 'branchabbotsford@master.ca',
          'Pacaire': 'info@luxuryclimate.ca',
          'Emco HVAC': 'info@luxuryclimate.ca',
          'Emco Plumbing': 'info@luxuryclimate.ca',
          'RSL': 'info@luxuryclimate.ca',
          'Brooks Supply': 'info@luxuryclimate.ca',
          'Mitsubishi': 'info@luxuryclimate.ca',
          'Andrew Sheret': 'info@luxuryclimate.ca',
          'Home Depot': 'info@luxuryclimate.ca',
          'Amazon': 'info@luxuryclimate.ca',
          'Electrician Sub': 'kevin@huntleyltd.com',
          'HVAC Sub': 'info@luxuryclimate.ca',
          'Technicial Safety': 'info@luxuryclimate.ca'
        };

        // Parse service CSV
        const serviceResults = Papa.parse(serviceCsv, { header: true, skipEmptyLines: true });
        const services = serviceResults.data.map(item => ({
          type: 'Service',
          category: `${item.category} > ${item.subcategory_1 || ''} > ${item.subcategory_2 || ''} > ${item.subcategory_3 || ''}`.replace(/\s>\s$/g, ''),
          name: item.name,
          description: item.description,
          price: parseFloat(item.price.replace('$', '')),
          cost: parseFloat(item.cost.replace('$', '')),
          taxable: item.taxable === 'true',
          unit_of_measure: item.unit_of_measure,
          task_code: item.task_code,
          uuid: item.uuid,
          part_number: item.task_code || item.uuid,
          vendor: item.task_code === 'JOURNEYMAN' ? 'HVAC Sub' : 'Master' // Default to Master unless specific
        }));

        // Parse material CSV
        const materialResults = Papa.parse(materialCsv, { header: true, skipEmptyLines: true });
        const materials = materialResults.data.map(item => {
          // Find vendor from Luxury_Order_E-mail_20250327.xlsx
          const orderItem = orderItems.find(order => order.part_number === item.part_number);
          const vendor = orderItem ? orderItem.vendor : 'Master';
          return {
            type: 'Material',
            category: `${item.category} > ${item.subcategory_1 || ''} > ${item.subcategory_2 || ''}`.replace(/\s>\s$/g, ''),
            name: item.name,
            description: item.description,
            price: parseFloat(item.price.replace('$', '')),
            cost: parseFloat(item.cost.replace('$', '')),
            taxable: item.taxable === 'true',
            unit_of_measure: item.unit_of_measure,
            part_number: item.part_number,
            uuid: item.uuid,
            vendor: vendor
          };
        });

        // Combine services and materials
        this.pricebook = [...services, ...materials];

        // Add vendor email to each item
        this.pricebook.forEach(item => {
          item.vendorEmail = vendorMap[item.vendor] || 'info@luxuryclimate.ca';
        });
      } catch (error) {
        console.error('Error loading pricebook:', error.message);
      }
    },

    calculateQuote() {
      const system = this.pricebook.find(item => item.uuid === this.editForm.selectedSystem);
      const installDays = parseFloat(this.editForm.estimatedInstallDays) || 0;
      const journeymanRate = 152; // $152/hour
      const hoursPerDay = 8;

      let quoteAmount = 0;
      if (system) {
        quoteAmount += system.price;
      }
      quoteAmount += installDays * hoursPerDay * journeymanRate;

      this.editForm.quoteAmount = Math.round(quoteAmount * 100) / 100;
    },

    handleImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          this.editForm.atticImage = reader.result; // Store base64 string
          this.autoSave();
        };
        reader.readAsDataURL(file);
      }
    },

    addItem() {
      this.order.items.push({ uuid: '', quantity: 1 });
    },

    removeItem(index) {
      this.order.items.splice(index, 1);
    },

    updateItemVendor(index) {
      const item = this.order.items[index];
      const pricebookItem = this.pricebook.find(p => p.uuid === item.uuid);
      if (pricebookItem) {
        item.vendor = pricebookItem.vendor;
        item.vendorEmail = pricebookItem.vendorEmail;
      }
    },

    async generateOrderPdf(supplier, items) {
      const html = `
        <div style="font-family: Arial; padding: 20px;">
          <h2>${supplier} Order Summary</h2>
          <p><strong>Project Account:</strong> ${this.order.projectAccount}</p>
          <p><strong>PO:</strong> ${this.order.jobNumber}</p>
          <p><strong>Address:</strong> ${this.order.address}</p>
          <p><strong>Shipping Date:</strong> ${this.order.shippingDate}</p>
          <p><strong>Delivery Details:</strong> ${this.order.deliveryDetails}</p>
          <p><strong>Delivery Contact Name:</strong> ${this.order.deliveryName}</p>
          <p><strong>Delivery Contact Phone:</strong> ${this.order.deliveryPhone}</p>
          <br>
          <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
            <tr>
              <th>Quantity</th><th>SKU</th><th>Description</th>
            </tr>
            ${items.map(item => {
              const pricebookItem = this.pricebook.find(p => p.uuid === item.uuid);
              return `
                <tr>
                  <td>${item.quantity}</td>
                  <td>${pricebookItem.part_number || pricebookItem.task_code || pricebookItem.uuid}</td>
                  <td>${pricebookItem.name}</td>
                </tr>
              `;
            }).join('')}
          </table>
        </div>
      `;
      const element = document.createElement('div');
      element.innerHTML = html;
      const opt = {
        margin: 1,
        filename: `${supplier}_${this.order.jobNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      const pdf = await html2pdf().from(element).set(opt).output('datauristring');
      return { pdfDataUri: pdf, filename: opt.filename };
    },

    async submitOrder() {
      try {
        // Group items by vendor
        const itemsByVendor = {};
        this.order.items.forEach(item => {
          const pricebookItem = this.pricebook.find(p => p.uuid === item.uuid);
          if (pricebookItem && item.quantity > 0) {
            const vendor = pricebookItem.vendor;
            if (!itemsByVendor[vendor]) {
              itemsByVendor[vendor] = { items: [], email: pricebookItem.vendorEmail };
            }
            itemsByVendor[vendor].items.push(item);
          }
        });

        // Generate and send PDFs for each vendor
        for (const [vendor, { items, email }] of Object.entries(itemsByVendor)) {
          const { pdfDataUri, filename } = await this.generateOrderPdf(vendor, items);
          const pdfBase64 = pdfDataUri.split(',')[1];

          const response = await fetch('YOUR_SUBMIT_ORDER_WEBHOOK_URL', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'submit_order',
              order: {
                jobNumber: this.order.jobNumber,
                address: this.order.address,
                installDates: this.order.installDates,
                siteName: this.order.siteName,
                sitePhone: this.order.sitePhone,
                shippingDate: this.order.shippingDate,
                deliveryDetails: this.order.deliveryDetails,
                deliveryName: this.order.deliveryName,
                deliveryPhone: this.order.deliveryPhone,
                projectAccount: this.order.projectAccount,
                items: items.map(item => {
                  const pricebookItem = this.pricebook.find(p => p.uuid === item.uuid);
                  return {
                    uuid: item.uuid,
                    quantity: item.quantity,
                    part_number: pricebookItem.part_number || pricebookItem.task_code || pricebookItem.uuid,
                    description: pricebookItem.name,
                    vendor: pricebookItem.vendor
                  };
                })
              },
              pdf: {
                filename: filename,
                data: pdfBase64
              },
              recipient: email
            })
          });

          if (!response.ok) {
            throw new Error(`Failed to send order to ${vendor}: ${response.status}`);
          }
        }

        alert('Orders sent to suppliers.');
        this.order = {
          jobNumber: '',
          address: '',
          installDates: '',
          siteName: '',
          sitePhone: '',
          shippingDate: '',
          deliveryDetails: '',
          deliveryName: '',
          deliveryPhone: '',
          projectAccount: 'no',
          items: []
        };
      } catch (error) {
        console.error('Error submitting order:', error.message);
        alert('Failed to submit order: ' + error.message);
      }
    },

    async loadEstimates() {
      try {
        const response = await fetch('https://hook.us2.make.com/dvzmo319g49moixmiv5daqb5jir1kihc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'list_estimates' })
        });
        if (response.ok) {
          const data = await response.json();
          this.estimates = Array.isArray(data.records) ? data.records : [];
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          this.estimates = this.estimates.filter(e => {
            if (!e.created_at) return false;
            const createdAt = new Date(e.created_at);
            return !isNaN(createdAt.getTime()) && createdAt >= threeMonthsAgo;
          });
        }
      } catch (error) {
        console.error('Error loading estimates:', error.message);
      }
    },

    async autoSave() {
      try {
        const response = await fetch('https://hook.us2.make.com/dvzmo319g49moixmiv5daqb5jir1kihc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'auto_save',
            estimate_id: this.editForm.estimate_id,
            customerId: this.editForm.customerId,
            formData: this.editForm
          })
        });
        if (!response.ok) {
          console.error('Failed to auto-save:', response.status);
        }
      } catch (error) {
        console.error('Error auto-saving:', error.message);
      }
    },

    async loadSavedData(estimateId, customerId) {
      try {
        const response = await fetch('https://hook.us2.make.com/dvzmo319g49moixmiv5daqb5jir1kihc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'load_saved_data',
            estimate_id: estimateId,
            customerId: customerId
          })
        });
        if (response.ok) {
          const savedData = await response.json();
          if (savedData && savedData.formData) {
            this.editForm = { ...this.editForm, ...savedData.formData };
            this.calculateQuote();
          }
        }
      } catch (error) {
        console.error('Error loading saved data:', error.message);
      }
    },

    async sendRebateInfo() {
      try {
        const response = await fetch('https://hook.us2.make.com/dvzmo319g49moixmiv5daqb5jir1kihc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_rebate_info',
            customerId: this.editForm.customerId,
            infoBundles: this.editForm.infoBundles
          })
        });
        if (response.ok) {
          alert('Information sent to customer.');
          this.editForm.infoBundles = [];
          await this.autoSave();
        }
      } catch (error) {
        console.error('Error sending info:', error.message);
      }
    },

    async openEditModal(estimate) {
      this.editForm = {
        estimate_id: estimate.estimate_id || '',
        customerName: estimate.customerName || '',
        siteAddress: estimate.siteAddress || '',
        customerId: estimate.customerId || '',
        status: estimate.status || 'Estimate Needs To Be Completed',
        purposeOfVisit: [],
        otherPurpose: '',
        rebatesResearched: 'not_interested',
        espCode: '',
        infoBundles: [],
        financingInterest: 'no',
        financingOptions: [],
        otherFinancingOption: '',
        additions: 'no',
        additionsDetails: '',
        windowsInsulation: 'no',
        windowsInsulationDetails: '',
        mechanicalRoomLocation: '',
        gasPipingSupport: 'yes',
        gasPipingIssues: [],
        otherGasPipingIssue: '',
        floorDrain: 'yes',
        electricalPanelCapacity: 'sufficient',
        electricalPanelIssues: '',
        draftsNoticed: 'no',
        draftsNoticedDetails: '',
        basementDampness: 'no',
        basementDampnessDetails: '',
        airPurifiers: 'no',
        indoorUnits: '',
        ductingCondition: 'good',
        ductingIssues: '',
        atticHeight: '',
        atticImage: '',
        ventilationFanLocation: '',
        outdoorUnitLocation: '',
        lidarScan: 'no',
        selectedSystem: '',
        estimatedInstallDays: '',
        quoteAmount: ''
      };
      await this.loadSavedData(estimate.estimate_id, estimate.customerId);
      this.editStep = 1;
      this.showEditModal = true;
    },

    async saveEstimate() {
      try {
        const response = await fetch('https://hook.us2.make.com/dvzmo319g49moixmiv5daqb5jir1kihc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'auto_save',
            estimate_id: this.editForm.estimate_id,
            customerId: this.editForm.customerId,
            formData: this.editForm
          })
        });
        if (response.ok) {
          this.showEditModal = false;
          await this.loadEstimates();
          alert('Estimate updated.');
        } else {
          console.error('Failed to save estimate:', response.status);
        }
      } catch (error) {
        console.error('Error saving estimate:', error.message);
      }
    },

    async deleteEstimate(estimate_id) {
      if (!confirm('Are you sure you want to delete this estimate?')) return;
      try {
        const response = await fetch('https://hook.us2.make.com/dvzmo319g49moixmiv5daqb5jir1kihc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'estimate.deleted',
            data: { id: estimate_id }
          })
        });
        if (response.ok) {
          await this.loadEstimates();
          alert('Estimate deleted.');
        }
      } catch (error) {
        console.error('Error deleting estimate:', error.message);
      }
    },

    async refreshEstimates() {
      await this.loadEstimates();
    }
  };
}

// Mock orderItems from Luxury_Order_E-mail_20250327.xlsx (replace with actual data extraction if needed)
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