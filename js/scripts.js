async function loadFileData(filename) {
  try {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    const idToken = await user.getIdToken();
    const response = await fetch(`/api/proxy?file=${filename}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    console.log(`Loaded ${filename}`);
    return csvText;
  } catch (error) {
    console.error(`Error fetching ${filename}:`, error.message);
    return "";
  }
}

function estimateApp() {
  return {
    page: 'estimate',
    estimates: [],
    pricebook: [],
    referenceSheet: [],
    selectedEstimateId: '',
    showEditModal: false,
    editStep: 1,
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
      estimateDate: '',
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
      await this.loadReferenceSheet();
      await this.loadPricebook();
      await this.loadEstimates();
    },

    async loadReferenceSheet() {
      try {
        const db = firebase.firestore();
        const querySnapshot = await db.collection('reference_sheet').get();
        this.referenceSheet = querySnapshot.docs.map(doc => doc.data());
      } catch (error) {
        console.error('Error loading reference sheet:', error.message);
      }
    },

    async loadPricebook() {
      try {
        const serviceCsv = await loadFileData('LuxuryClimateHVACLtd_pricebook_export.csv');
        const materialCsv = await loadFileData('LuxuryClimateHVACLtd_pricebook_materials_export.csv');

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
          vendor: item.task_code === 'JOURNEYMAN' ? 'HVAC Sub' : 'Master'
        }));

        const materialResults = Papa.parse(materialCsv, { header: true, skipEmptyLines: true });
        const materials = materialResults.data.map(item => {
          const orderItem = this.referenceSheet.find(order => order.part_number === item.part_number);
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

        this.pricebook = [...services, ...materials];
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
      const journeymanRate = 152;
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
          this.editForm.atticImage = reader.result;
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
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        const idToken = await user.getIdToken();
        const db = firebase.firestore();
        
        // Save the order to Firestore
        const jobRef = db.collection('jobs').doc(this.order.jobNumber);
        await jobRef.set({
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
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // Save parts to subcollection
        const batch = db.batch();
        this.order.items.forEach((item, index) => {
          const pricebookItem = this.pricebook.find(p => p.uuid === item.uuid);
          if (pricebookItem && item.quantity > 0) {
            const partRef = jobRef.collection('parts').doc(`part_${index}`);
            batch.set(partRef, {
              uuid: item.uuid,
              quantity: item.quantity,
              part_number: pricebookItem.part_number || pricebookItem.task_code || pricebookItem.uuid,
              description: pricebookItem.name,
              vendor: pricebookItem.vendor,
            });
          }
        });
        await batch.commit();

        // Generate and send PDFs
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

        for (const [vendor, { items, email }] of Object.entries(itemsByVendor)) {
          const { pdfDataUri, filename } = await this.generateOrderPdf(vendor, items);
          const pdfBase64 = pdfDataUri.split(',')[1];

          const response = await fetch('https://hook.us2.make.com/dvzmo319g49moixmiv5daqb5jir1kihc', {
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
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        const idToken = await user.getIdToken();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const formattedDate = threeMonthsAgo.toISOString().split('T')[0];
        const response = await fetch(`/api/proxy?path=estimates&created_after=${formattedDate}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch estimates: ${response.status}`);
        }
        const data = await response.json();
        this.estimates = data.estimates || [];
      } catch (error) {
        console.error('Error loading estimates:', error.message);
      }
    },

    async fetchEstimateDetails() {
      const estimateId = this.selectedEstimateId;
      if (estimateId) {
        try {
          const user = firebase.auth().currentUser;
          if (!user) throw new Error('User not authenticated');

          const idToken = await user.getIdToken();
          const response = await fetch(`/api/proxy?path=estimates/${estimateId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${idToken}`,
            },
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch estimate details: ${response.status}`);
          }
          const estimate = await response.json();
          this.editForm = {
            estimate_id: estimate.id || '',
            customerName: estimate.customerName || '',
            siteAddress: estimate.siteAddress || '',
            customerId: estimate.customerId || '',
            status: estimate.status || 'Estimate Needs To Be Completed',
            estimateDate: estimate.created_at ? estimate.created_at.split('T')[0] : '',
            purposeOfVisit: estimate.purposeOfVisit || [],
            otherPurpose: estimate.otherPurpose || '',
            rebatesResearched: estimate.rebatesResearched || 'not_interested',
            espCode: estimate.espCode || '',
            infoBundles: estimate.infoBundles || [],
            financingInterest: estimate.financingInterest || 'no',
            financingOptions: estimate.financingOptions || [],
            otherFinancingOption: estimate.otherFinancingOption || '',
            additions: estimate.additions || 'no',
            additionsDetails: estimate.additionsDetails || '',
            windowsInsulation: estimate.windowsInsulation || 'no',
            windowsInsulationDetails: estimate.windowsInsulationDetails || '',
            mechanicalRoomLocation: estimate.mechanicalRoomLocation || '',
            gasPipingSupport: estimate.gasPipingSupport || 'yes',
            gasPipingIssues: estimate.gasPipingIssues || [],
            otherGasPipingIssue: estimate.otherGasPipingIssue || '',
            floorDrain: estimate.floorDrain || 'yes',
            electricalPanelCapacity: estimate.electricalPanelCapacity || 'sufficient',
            electricalPanelIssues: estimate.electricalPanelIssues || '',
            draftsNoticed: estimate.draftsNoticed || 'no',
            draftsNoticedDetails: estimate.draftsNoticedDetails || '',
            basementDampness: estimate.basementDampness || 'no',
            basementDampnessDetails: estimate.basementDampnessDetails || '',
            airPurifiers: estimate.airPurifiers || 'no',
            indoorUnits: estimate.indoorUnits || '',
            ductingCondition: estimate.ductingCondition || 'good',
            ductingIssues: estimate.ductingIssues || '',
            atticHeight: estimate.atticHeight || '',
            atticImage: estimate.atticImage || '',
            ventilationFanLocation: estimate.ventilationFanLocation || '',
            outdoorUnitLocation: estimate.outdoorUnitLocation || '',
            lidarScan: estimate.lidarScan || 'no',
            selectedSystem: estimate.selectedSystem || '',
            estimatedInstallDays: estimate.estimatedInstallDays || '',
            quoteAmount: estimate.quoteAmount || ''
          };
          await this.loadSavedData(estimate.id, estimate.customerId);
          this.showEditModal = true;
          this.editStep = 1;
        } catch (error) {
          console.error('Error fetching estimate details:', error.message);
        }
      }
    },

    async autoSave() {
      try {
        const db = firebase.firestore();
        const jobRef = db.collection('jobs').doc(this.editForm.estimate_id);
        
        // Save consultation data as a subcollection
        const batch = db.batch();
        Object.keys(this.editForm).forEach(key => {
          if (this.editForm[key] !== '' && this.editForm[key] !== null && this.editForm[key] !== undefined) {
            const dataPointRef = jobRef.collection('consultation_data').doc(key);
            batch.set(dataPointRef, {
              key: key,
              value: this.editForm[key]
            });
          }
        });
        await batch.commit();
      } catch (error) {
        console.error('Error auto-saving:', error.message);
      }
    },

    async loadSavedData(estimateId, customerId) {
      try {
        const db = firebase.firestore();
        const jobRef = db.collection('jobs').doc(estimateId);
        const consultationDataSnapshot = await jobRef.collection('consultation_data').get();
        
        const savedData = {};
        consultationDataSnapshot.forEach(doc => {
          const data = doc.data();
          savedData[data.key] = data.value;
        });

        this.editForm = { ...this.editForm, ...savedData };
        this.calculateQuote();
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
        estimateDate: estimate.created_at ? estimate.created_at.split('T')[0] : '',
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
        await this.autoSave();
        this.showEditModal = false;
        await this.loadEstimates();
        alert('Estimate updated.');
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