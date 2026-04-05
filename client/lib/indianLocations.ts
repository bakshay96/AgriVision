// Comprehensive Indian States, Districts and Talukas data
// Based on Government of India data

export interface LocationData {
  state: string;
  districts: {
    name: string;
    talukas: string[];
  }[];
}

export const indianLocations: LocationData[] = [
  {
    state: "Maharashtra",
    districts: [
      {
        name: "Mumbai",
        talukas: ["Mumbai City", "Mumbai Suburban", "Andheri", "Borivali", "Dadar"]
      },
      {
        name: "Pune",
        talukas: ["Pune City", "Haveli", "Baramati", "Bhor", "Daund", "Indapur", "Junnar", "Khed", "Maval", "Mulshi", "Purandar", "Shirur", "Velhe"]
      },
      {
        name: "Nagpur",
        talukas: ["Nagpur City", "Nagpur Rural", "Hingna", "Kamptee", "Katol", "Narkhed", "Ramtek", "Savner", "Umred"]
      },
      {
        name: "Nashik",
        talukas: ["Nashik City", "Nashik Rural", "Baglan", "Chandwad", "Deola", "Dindori", "Igatpuri", "Kalwan", "Malegaon", "Nandgaon", "Peint", "Sinnar", "Surgana", "Trimbakeshwar", "Yeola"]
      },
      {
        name: "Thane",
        talukas: ["Thane City", "Thane Rural", "Ambarnath", "Bhiwandi", "Kalyan", "Murbad", "Palghar", "Shahapur", "Ulhasnagar", "Vasai", "Vada"]
      },
      {
        name: "Ahmednagar",
        talukas: ["Ahmednagar", "Akole", "Jamkhed", "Karjat", "Kopargaon", "Nagar", "Nevasa", "Parner", "Pathardi", "Rahata", "Rahuri", "Sangamner", "Shevgaon", "Shrigonda", "Shrirampur"]
      },
      {
        name: "Solapur",
        talukas: ["Solapur City", "Solapur North", "Solapur South", "Akkalkot", "Barshi", "Karmala", "Madha", "Malshiras", "Mangalvedhe", "Mohol", "Pandharpur", "Sangole"]
      },
      {
        name: "Satara",
        talukas: ["Satara", "Jaoli", "Karad", "Khandala", "Khatav", "Koregaon", "Mahabaleshwar", "Man", "Patan", "Phaltan", "Wai"]
      },
      {
        name: "Sangli",
        talukas: ["Sangli", "Atpadi", "Jat", "Kadegaon", "Kavathemahankal", "Miraj", "Palus", "Shirala", "Tasgaon", "Walwa"]
      },
      {
        name: "Kolhapur",
        talukas: ["Kolhapur", "Ajra", "Bavda", "Chandgad", "Gadhinglaj", "Hatkanangale", "Kagal", "Karvir", "Panhala", "Radhanagari", "Shahuwadi", "Shirol"]
      },
      {
        name: "Aurangabad",
        talukas: ["Aurangabad City", "Aurangabad Rural", "Gangapur", "Kannad", "Khuldabad", "Paithan", "Phulambri", "Sillod", "Soegaon", "Vaijapur"]
      },
      {
        name: "Jalgaon",
        talukas: ["Jalgaon", "Amalner", "Bhadgaon", "Bhusawal", "Bodwad", "Chalisgaon", "Chopda", "Dharangaon", "Erandol", "Jamner", "Muktainagar", "Pachora", "Parola", "Raver", "Yawal"]
      },
      {
        name: "Nanded",
        talukas: ["Nanded", "Ardhapur", "Bhokar", "Biloli", "Degloor", "Dharmabad", "Hadgaon", "Himayatnagar", "Kandhar", "Kinwat", "Loha", "Mahoor", "Mudkhed", "Mukhed", "Naigaon", "Umri"]
      },
      {
        name: "Latur",
        talukas: ["Latur", "Ahmadpur", "Ausa", "Chakur", "Deoni", "Jalkot", "Nilanga", "Renapur", "Shirur-Anantpal", "Udgir"]
      },
      {
        name: "Beed",
        talukas: ["Beed", "Ambejogai", "Ashti", "Bid", "Dharur", "Georai", "Kaij", "Manjlegaon", "Parli", "Patoda", "Shirur-Kasar", "Wadwani"]
      },
      {
        name: "Osmanabad",
        talukas: ["Osmanabad", "Bhum", "Kalamb", "Lohara", "Omerga", "Paranda", "Tuljapur", "Umarga", "Vashi", "Washi"]
      },
      {
        name: "Jalna",
        talukas: ["Jalna", "Ambad", "Badnapur", "Bhokardan", "Ghansawangi", "Jafrabad", "Mantha", "Partur"]
      },
      {
        name: "Parbhani",
        talukas: ["Parbhani", "Gangakhed", "Jintur", "Manwath", "Palam", "Pathri", "Purna", "Sailu", "Sonpeth"]
      },
      {
        name: "Hingoli",
        talukas: ["Hingoli", "Aundha-Nagnath", "Basmath", "Kalamanuri", "Sengaon"]
      },
      {
        name: "Washim",
        talukas: ["Washim", "Karanja", "Malegaon", "Mangrulpir", "Manora", "Risod", "Washim Rural"]
      },
      {
        name: "Yavatmal",
        talukas: ["Yavatmal", "Arni", "Babhulgaon", "Darwha", "Digras", "Ghatanji", "Kalamb", "Mahagaon", "Maregaon", "Ner", "Pusad", "Ralegaon", "Umarkhed", "Wani", "Zari-Jamani"]
      },
      {
        name: "Amravati",
        talukas: ["Amravati", "Achalpur", "Anjangaon-Surji", "Chandurbazar", "Chandur", "Daryapur", "Dhamangaon", "Morshi", "Nandgaon-Khandeshwar", "Teosa", "Warud"]
      },
      {
        name: "Akola",
        talukas: ["Akola", "Akot", "Balapur", "Barshitakli", "Murtizapur", "Patur", "Telhara"]
      },
      {
        name: "Buldhana",
        talukas: ["Buldhana", "Chikhli", "Deolgaon", "Jalgaon-Jamod", "Khamgaon", "Lonar", "Malkapur", "Mehkar", "Motala", "Nandura", "Shegaon", "Sindkhedraja"]
      },
      {
        name: "Chandrapur",
        talukas: ["Chandrapur", "Ballarpur", "Bhadravati", "Brahmapuri", "Chimur", "Gondpipri", "Jiwati", "Korpana", "Mul", "Nagbhid", "Pombhurna", "Rajura", "Sawali", "Sindewahi", "Warora"]
      },
      {
        name: "Gadchiroli",
        talukas: ["Gadchiroli", "Aheri", "Armori", "Bhamragad", "Chamorshi", "Dhanora", "Desaiganj", "Etapalli", "Korchi", "Kurkheda", "Mulchera", "Sironcha"]
      },
      {
        name: "Gondia",
        talukas: ["Gondia", "Amgaon", "Arjuni-Morgaon", "Deori", "Goregaon", "Sadak-Arjuni", "Salekasa", "Tirora"]
      },
      {
        name: "Bhandara",
        talukas: ["Bhandara", "Lakhani", "Lakhandur", "Mohadi", "Pauni", "Sakoli", "Tumsar"]
      },
      {
        name: "Wardha",
        talukas: ["Wardha", "Arvi", "Ashti", "Deoli", "Hinganghat", "Karanja", "Samudrapur", "Seloo"]
      },
      {
        name: "Nandurbar",
        talukas: ["Nandurbar", "Akkalkuwa", "Akrani", "Navapur", "Shahada", "Taloda"]
      },
      {
        name: "Dhule",
        talukas: ["Dhule", "Dondaicha", "Shirpur", "Sindkheda", "Sakri"]
      },
      {
        name: "Palghar",
        talukas: ["Palghar", "Dahanu", "Jawhar", "Mokhada", "Talasari", "Vasai", "Vikramgad", "Wada"]
      },
      {
        name: "Ratnagiri",
        talukas: ["Ratnagiri", "Chiplun", "Dapoli", "Guhagar", "Khed", "Lanja", "Mandangad", "Rajapur", "Sangameshwar"]
      },
      {
        name: "Sindhudurg",
        talukas: ["Sindhudurg", "Devgad", "Kankavli", "Kudal", "Malvan", "Sawantwadi", "Vaibhavwadi", "Vengurla"]
      }
    ]
  },
  {
    state: "Gujarat",
    districts: [
      { name: "Ahmedabad", talukas: ["Ahmedabad City", "Ahmedabad Rural", "Bavla", "Daskroi", "Detroj-Rampura", "Dhandhuka", "Dholka", "Mandal", "Sanand", "Viramgam"] },
      { name: "Surat", talukas: ["Surat City", "Surat Rural", "Bardoli", "Choryasi", "Kamrej", "Mahuva", "Mandvi", "Mangrol", "Olpad", "Palsana", "Umarpada"] },
      { name: "Vadodara", talukas: ["Vadodara City", "Vadodara Rural", "Dabhoi", "Desar", "Karjan", "Padra", "Savli", "Sinor", "Vaghodia"] },
      { name: "Rajkot", talukas: ["Rajkot City", "Rajkot Rural", "Dhoraji", "Gondal", "Jamkandorna", "Jasdan", "Jetpur", "Kotda-Sangani", "Lodhika", "Paddhari", "Upleta", "Vinchhiya"] },
      { name: "Bhavnagar", talukas: ["Bhavnagar", "Gariadhar", "Ghogha", "Jesar", "Mahuva", "Palitana", "Sihor", "Talaja", "Umrala", "Vallabhipur"] },
      { name: "Jamnagar", talukas: ["Jamnagar", "Bhanvad", "Dhrol", "Jodiya", "Kalavad", "Kalyanpur", "Lalpur", "Okhamandal"] },
      { name: "Gandhinagar", talukas: ["Gandhinagar", "Dehgam", "Kalol", "Mansa"] },
      { name: "Kutch", talukas: ["Bhuj", "Abdasa", "Anjar", "Bhachau", "Gandhidham", "Lakhpat", "Mandvi", "Mundra", "Nakhatrana", "Rapar"] },
      { name: "Mehsana", talukas: ["Mehsana", "Becharaji", "Jotana", "Kadi", "Kheralu", "Satlasana", "Unjha", "Vadnagar", "Vijapur", "Visnagar"] },
      { name: "Patan", talukas: ["Patan", "Chanasma", "Harij", "Radhanpur", "Sami", "Santalpur", "Saraswati", "Sidhpur"] }
    ]
  },
  {
    state: "Karnataka",
    districts: [
      { name: "Bangalore", talukas: ["Bangalore North", "Bangalore South", "Bangalore East", "Bangalore West", "Anekal", "Yelahanka"] },
      { name: "Mysore", talukas: ["Mysore", "Heggadadevanakote", "Hunsur", "Krishnarajanagara", "Nanjangud", "Piriyapatna", "Tirumakudal-Narsipur"] },
      { name: "Hubli-Dharwad", talukas: ["Hubli", "Dharwad", "Kalghatgi", "Kundgol", "Navalgund"] },
      { name: "Mangalore", talukas: ["Mangalore", "Bantwal", "Beltangadi", "Puttur", "Sulya"] },
      { name: "Belgaum", talukas: ["Belgaum", "Athani", "Bailhongal", "Chikodi", "Gokak", "Hukkeri", "Khanapur", "Ramdurg", "Raybag", "Saundatti"] }
    ]
  },
  {
    state: "Tamil Nadu",
    districts: [
      { name: "Chennai", talukas: ["Chennai North", "Chennai South", "Chennai Central", "Tiruvottiyur", "Maduravoyal", "Ambattur", "Avadi"] },
      { name: "Coimbatore", talukas: ["Coimbatore North", "Coimbatore South", "Annur", "Kinathukadavu", "Madukkarai", "Mettupalayam", "Perur", "Pollachi", "Sulur", "Valparai"] },
      { name: "Madurai", talukas: ["Madurai North", "Madurai South", "Madurai East", "Madurai West", "Melur", "Thirupparankundram", "Usilampatti", "Vadipatti"] },
      { name: "Salem", talukas: ["Salem", "Attur", "Edappadi", "Gangavalli", "Mettur", "Omalur", "Pethanaickenpalayam", "Salem South", "Sankari", "Vazhapadi", "Yercaud"] },
      { name: "Tiruchirappalli", talukas: ["Tiruchirappalli", "Lalgudi", "Manachanallur", "Manapparai", "Marungapuri", "Musiri", "Srirangam", "Thottiyam", "Thuraiyur"] }
    ]
  },
  {
    state: "Telangana",
    districts: [
      { name: "Hyderabad", talukas: ["Hyderabad", "Ameerpet", "Asifnagar", "Bahadurpura", "Bandlaguda", "Charminar", "Golconda", "Himayathnagar", "Khairatabad", "Marredpally", "Musheerabad", "Nampally", "Saidabad", "Secunderabad"] },
      { name: "Warangal", talukas: ["Warangal", "Atmakur", "Damera", "Geesugonda", "Khanapur", "Khila Warangal", "Nallabelly", "Narsampet", "Nekkonda", "Parvathagiri", "Raiparthy", "Sangem", "Wardhannapet"] },
      { name: "Nizamabad", talukas: ["Nizamabad", "Armur", "Balkonda", "Bheemgal", "Bodhan", "Dichpalle", "Domakonda", "Jakranpalle", "Kammarapalle", "Kotgiri", "Makloor", "Mortad", "Nandipet", "Navipet", "Sirkonda", "Velpur", "Yergatla"] }
    ]
  },
  {
    state: "Andhra Pradesh",
    districts: [
      { name: "Visakhapatnam", talukas: ["Visakhapatnam", "Anakapalle", "Bheemunipatnam", "Chodavaram", "Devarapalle", "Gajuwaka", "K.Kotapadu", "Kasimkota", "Madugula", "Marripalem", "Munagapaka", "Narsipatnam", "Paderu", "Padmanabham", "Paravada", "Payakaraopeta", "Rambilli", "Ravikamatham", "S.Rayavaram", "Sabbavaram", "Yelamanchili"] },
      { name: "Vijayawada", talukas: ["Vijayawada", "Gannavaram", "Gudivada", "Gudlavalleru", "Jaggayyapeta", "Kaikaluru", "Kankipadu", "Movva", "Mylavaram", "Nandigama", "Nuzvid", "Pamarru", "Pamidimukkala", "Penamaluru", "Reddigudem", "Thotlavalluru", "Tiruvuru", "Vissannapeta"] }
    ]
  },
  {
    state: "Kerala",
    districts: [
      { name: "Thiruvananthapuram", talukas: ["Thiruvananthapuram", "Attingal", "Chirayinkeezhu", "Kattakada", "Nedumangad", "Neyyattinkara", "Varkala"] },
      { name: "Kochi", talukas: ["Kochi", "Aluva", "Angamaly", "Kothamangalam", "Muvattupuzha", "Paravur", "Perumbavoor"] },
      { name: "Kozhikode", talukas: ["Kozhikode", "Balussery", "Feroke", "Koduvally", "Koyilandy", "Mavoor", "Perambra", "Thamarassery", "Thodannur"] },
      { name: "Thrissur", talukas: ["Thrissur", "Chalakudy", "Chavakkad", "Irinjalakuda", "Kodungallur", "Kunnamkulam", "Mukundapuram", "Ollukkara", "Thalapilly", "Wadakkancherry"] }
    ]
  },
  {
    state: "Rajasthan",
    districts: [
      { name: "Jaipur", talukas: ["Jaipur", "Amber", "Bassi", "Chaksu", "Chomu", "Dudu", "Jamwa-Ramgarh", "Kotputli", "Mauzmabad", "Phagi", "Phulera", "Sambhar", "Sanganer", "Shahpura", "Viratnagar"] },
      { name: "Jodhpur", talukas: ["Jodhpur", "Balesar", "Bap", "Bilara", "Luni", "Mandore", "Osian", "Phalodi", "Pipar City", "Sardarpura", "Shergarh", "Tinwari"] },
      { name: "Udaipur", talukas: ["Udaipur", "Badgaon", "Bhinder", "Girwa", "Gogunda", "Jhadol", "Kherwara", "Kotra", "Lasadiya", "Mavli", "Rishabhdeo", "Salumber", "Sarada", "Semari", "Vallabhnagar"] },
      { name: "Kota", talukas: ["Kota", "Digod", "Kaithoon", "Ladpura", "Pipalda", "Ramganj Mandi", "Sangod"] },
      { name: "Ajmer", talukas: ["Ajmer", "Beawar", "Bhinay", "Jawaja", "Kekri", "Kishangarh", "Masuda", "Nasirabad", "Peesangan", "Sarwar", "Tantoti"] }
    ]
  },
  {
    state: "Punjab",
    districts: [
      { name: "Ludhiana", talukas: ["Ludhiana", "Doraha", "Jagraon", "Khanna", "Machhiwara", "Mullanpur", "Payal", "Raikot", "Samrala", "Sidhwanbet"] },
      { name: "Amritsar", talukas: ["Amritsar", "Ajnala", "Baba Bakala", "Lopoke", "Majitha", "Tarsika"] },
      { name: "Jalandhar", talukas: ["Jalandhar", "Adampur", "Alawalpur", "Bhogpur", "Kartarpur", "Lohian", "Mehatpur", "Nakodar", "Nurmahal", "Phillaur", "Shahkot"] },
      { name: "Patiala", talukas: ["Patiala", "Bhadson", "Devigarh", "Ghanaur", "Nabha", "Pattran", "Rajpura", "Samana", "Sanaur"] }
    ]
  },
  {
    state: "Haryana",
    districts: [
      { name: "Gurgaon", talukas: ["Gurgaon", "Farrukhnagar", "Manesar", "Pataudi", "Sohna", "Tauru", "Wazirabad"] },
      { name: "Faridabad", talukas: ["Faridabad", "Ballabgarh", "Hathin", "Hodal", "Palwal"] },
      { name: "Ambala", talukas: ["Ambala", "Barara", "Naraingarh", "Shahzadpur"] },
      { name: "Karnal", talukas: ["Karnal", "Assandh", "Gharaunda", "Indri", "Nilokheri", "Nissing", "Taraori"] },
      { name: "Hisar", talukas: ["Hisar", "Adampur", "Agroha", "Barwala", "Hansi", "Narnaund", "Uklana"] }
    ]
  },
  {
    state: "Uttar Pradesh",
    districts: [
      { name: "Lucknow", talukas: ["Lucknow", "Bakshi Ka Talab", "Malihabad", "Mohanlalganj"] },
      { name: "Kanpur", talukas: ["Kanpur", "Bilhaur", "Ghatampur", "Kalyanpur", "Narwal"] },
      { name: "Varanasi", talukas: ["Varanasi", "Baragaon", "Chiraigaon", "Cholapur", "Harhua", "Kashi Vidyapeeth", "Pindra", "Sewapuri"] },
      { name: "Agra", talukas: ["Agra", "Bah", "Etmadpur", "Fatehabad", "Fatehpur Sikri", "Jagner", "Kheragarh", "Pinahat", "Saiyan"] },
      { name: "Allahabad", talukas: ["Allahabad", "Bara", "Handia", "Karchhana", "Koraon", "Meja", "Phulpur", "Soraon"] }
    ]
  },
  {
    state: "Bihar",
    districts: [
      { name: "Patna", talukas: ["Patna", "Barh", "Bikram", "Daniawan", "Dulhin Bazar", "Fatwah", "Khusrupur", "Maner", "Masaurhi", "Mokama", "Paliganj", "Pandarak", "Phulwari", "Punpun", "Sampatchak"] },
      { name: "Gaya", talukas: ["Gaya", "Amas", "Atri", "Bankebazar", "Barachatti", "Belaganj", "Bodh Gaya", "Dobhi", "Guraru", "Gurua", "Imamganj", "Khizirsarai", "Konch", "Manpur", "Mohanpur", "Paraiya", "Sherghati", "Tan Kuppa", "Tikari", "Wazirganj"] }
    ]
  },
  {
    state: "West Bengal",
    districts: [
      { name: "Kolkata", talukas: ["Kolkata", "Baranagar", "Barrackpore", "Bidhan Nagar", "Domjur", "Howrah", "Kamarhati", "Panihati", "Rajarhat", "Serampore"] },
      { name: "North 24 Parganas", talukas: ["Barasat", "Amdanga", "Baduria", "Bagda", "Bangaon", "Barasat", "Barrackpore", "Basirhat", "Bongaon", "Deganga", "Gaighata", "Habra", "Haroa", "Hasnabad", "Hingalganj", "Minakhan", "Rajarhat", "Sandeshkhali", "Swarupnagar"] }
    ]
  },
  {
    state: "Odisha",
    districts: [
      { name: "Bhubaneswar", talukas: ["Bhubaneswar", "Balianta", "Balipatna", "Banapur", "Baranga", "Begunia", "Bhubaneswar Rural", "Jatani", "Khordha", "Tangi"] },
      { name: "Cuttack", talukas: ["Cuttack", "Athagad", "Banki", "Baranga", "Cuttack Sadar", "Kantapada", "Kishannagar", "Mahanga", "Niali", "Nischintakoili", "Salipur", "Tangi"] }
    ]
  },
  {
    state: "Madhya Pradesh",
    districts: [
      { name: "Bhopal", talukas: ["Bhopal", "Berasia", "Huzur"] },
      { name: "Indore", talukas: ["Indore", "Depalpur", "Hatod", "Mhow", "Sawer"] },
      { name: "Gwalior", talukas: ["Gwalior", "Bhitarwar", "Chinore", "Dabra", "Morar"] },
      { name: "Jabalpur", talukas: ["Jabalpur", "Kundam", "Patan", "Panagar", "Shahpura", "Sihora"] },
      { name: "Ujjain", talukas: ["Ujjain", "Badnagar", "Ghatiya", "Khachrod", "Mahidpur", "Nagda", "Tarana"] }
    ]
  },
  {
    state: "Chhattisgarh",
    districts: [
      { name: "Raipur", talukas: ["Raipur", "Abhanpur", "Arang", "Bhatapara", "Bilaigarh", "Bindranavagarh", "Dharsiwa", "Kasdol", "Simga", "Tilda"] },
      { name: "Bilaspur", talukas: ["Bilaspur", "Bilha", "Kota", "Lormi", "Masturi", "Pandariya", "Pendra", "Takhatpur"] }
    ]
  },
  {
    state: "Jharkhand",
    districts: [
      { name: "Ranchi", talukas: ["Ranchi", "Angara", "Bero", "Bundu", "Chanho", "Itki", "Kanke", "Khelari", "Lapung", "Mandar", "Nagri", "Ormanjhi", "Rahe", "Ratu", "Silli", "Sonahatu", "Tamar"] },
      { name: "Jamshedpur", talukas: ["Jamshedpur", "Baharagora", "Chakulia", "Dhalbhumgarh", "Dumaria", "Ghatshila", "Golmuri-cum-Jugsalai", "Musabani", "Patamda", "Potka"] }
    ]
  },
  {
    state: "Assam",
    districts: [
      { name: "Guwahati", talukas: ["Guwahati", "Chandrapur", "Dispur", "Goroimari", "Kamrup", "Kayan", "North Guwahati", "Rangia", "Sualkuchi"] },
      { name: "Dibrugarh", talukas: ["Dibrugarh", "Chabua", "Dibrugarh East", "Dibrugarh West", "Lahoal", "Moran", "Naharkatia", "Tengakhat", "Tingkhong"] }
    ]
  }
];

// Helper functions
export const getAllStates = (): string[] => {
  return indianLocations.map(loc => loc.state).sort();
};

export const getDistrictsByState = (state: string): string[] => {
  const stateData = indianLocations.find(loc => loc.state === state);
  return stateData ? stateData.districts.map(d => d.name).sort() : [];
};

export const getTalukasByDistrict = (state: string, district: string): string[] => {
  const stateData = indianLocations.find(loc => loc.state === state);
  const districtData = stateData?.districts.find(d => d.name === district);
  return districtData ? districtData.talukas.sort() : [];
};

// Season-based crops data
export const kharifCrops = [
  "Rice", "Cotton", "Soybean", "Maize", "Sugarcane", "Bajra", 
  "Jowar", "Tur (Arhar)", "Moong", "Urad", "Groundnut", "Sesame",
  "Castor", "Niger", "Sunflower"
];

export const rabiCrops = [
  "Wheat", "Barley", "Gram (Chana)", "Lentil (Masur)", "Pea (Matar)",
  "Mustard", "Rapeseed", "Linseed", "Safflower", "Coriander",
  "Cumin", "Fenugreek", "Potato", "Onion", "Tomato"
];

export const zaidCrops = [
  "Watermelon", "Muskmelon", "Cucumber", "Bitter Gourd", "Bottle Gourd",
  "Pumpkin", "Summer Moong", "Summer Urad", "Sesame", "Groundnut"
];

// Regional crop suggestions based on states
export const regionalCrops: Record<string, string[]> = {
  "Maharashtra": ["Cotton", "Soybean", "Sugarcane", "Jowar", "Bajra", "Rice", "Wheat", "Gram"],
  "Gujarat": ["Cotton", "Groundnut", "Bajra", "Wheat", "Cumin", "Fennel", "Isabgol"],
  "Punjab": ["Wheat", "Rice", "Cotton", "Sugarcane", "Maize", "Barley"],
  "Haryana": ["Wheat", "Rice", "Cotton", "Sugarcane", "Bajra", "Mustard"],
  "Uttar Pradesh": ["Wheat", "Rice", "Sugarcane", "Potato", "Pulses", "Mustard"],
  "Rajasthan": ["Bajra", "Wheat", "Mustard", "Groundnut", "Cumin", "Guar"],
  "Karnataka": ["Ragi", "Jowar", "Maize", "Cotton", "Groundnut", "Sugarcane", "Coffee"],
  "Tamil Nadu": ["Rice", "Cotton", "Sugarcane", "Groundnut", "Millets", "Coconut"],
  "Andhra Pradesh": ["Rice", "Cotton", "Tobacco", "Chillies", "Groundnut", "Sugarcane"],
  "Telangana": ["Rice", "Cotton", "Maize", "Soybean", "Red Gram", "Chillies"],
  "Kerala": ["Rice", "Coconut", "Rubber", "Pepper", "Tea", "Coffee", "Cardamom"],
  "Bihar": ["Rice", "Wheat", "Maize", "Lentil", "Gram", "Sugarcane"],
  "West Bengal": ["Rice", "Jute", "Tea", "Potato", "Mustard", "Vegetables"],
  "Odisha": ["Rice", "Pulses", "Groundnut", "Cotton", "Sugarcane", "Turmeric"],
  "Madhya Pradesh": ["Wheat", "Soybean", "Gram", "Cotton", "Maize", "Rice"],
  "Chhattisgarh": ["Rice", "Maize", "Soybean", "Groundnut", "Pulses"],
  "Jharkhand": ["Rice", "Maize", "Pulses", "Wheat", "Potato"],
  "Assam": ["Rice", "Tea", "Jute", "Sugarcane", "Mustard", "Potato"]
};
