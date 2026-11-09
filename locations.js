/* ═══════════════════════════════════════════════════════════════════════════
   ESSENTRA — Delivery locations: City (District) → Zone (Thana / Upazila) → Area
   • All 64 districts, every upazila / metropolitan thana is listed as a Zone.
   • Area is OPTIONAL at checkout. Detailed area lists are included for Dhaka and the
     major cities; other zones simply have no Area list (customer writes it in Full Address).
   • To add or fix anything just edit this file:
        'Zone Name':'Area 1,Area 2,Area 3'      (no commas inside a name)
   • Inside / Outside Dhaka delivery charge is decided in script.js:
        Dhaka-city zones  → "inside"
        everything else   → "outside"   (list of exceptions: ESSENTRA_OUTSIDE_DHAKA_ZONES below)
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
  // Z('a,b,c')           → zones with no area list
  // D({zone:'a,b,c'})     → zones with areas
  var Z=function(s){var o={};s.split(',').forEach(function(k){o[k.trim()]=[];});return o;};
  var D=function(m){var o={};Object.keys(m).forEach(function(k){o[k]=m[k]?m[k].split(',').map(function(x){return x.trim();}):[];});return o;};
  var M=function(){var r={};for(var i=0;i<arguments.length;i++){var a=arguments[i];Object.keys(a).forEach(function(k){r[k]=a[k];});}return r;};

  var L={};

  /* ───────────────────────── DHAKA ───────────────────────── */
  L['Dhaka']=D({
    /* — Dhaka city (inside Dhaka delivery) — */
    'Adabor':'Adabor,Shyamoli,Baitul Aman Housing,Mohammadia Housing,Ring Road',
    'Badda':'Badda,Merul Badda,Middle Badda,Uttar Badda,Dakshin Badda,Satarkul,Beraid,Gudaraghat',
    'Banani':'Banani,Banani DOHS,Mohakhali DOHS,Kemal Ataturk Avenue',
    'Bangshal':'Bangshal,Nawabpur,Islampur,Mitford,Badamtoli',
    'Cantonment':'Dhaka Cantonment,Kachukhet,Matikata,Bhashantek',
    'Chawkbazar':'Chawkbazar,Bakshibazar,Churihatta',
    'Dakshinkhan':'Dakshinkhan,Ashkona,Hajj Camp,Faidabad,Tetultola',
    'Darus Salam':'Darus Salam,Rupnagar,Technical,Gabtoli',
    'Demra':'Demra,Konapara,Matuail,Sarulia,Staff Quarter',
    'Dhanmondi':'Dhanmondi R/A,Jhigatola,Science Laboratory,Sukrabad,Satmasjid Road',
    'Gendaria':'Gendaria,Dhupkhola,Sheikh Sahib Bazar,Rathkhola',
    'Gulshan':'Gulshan 1,Gulshan 2,Baridhara,Baridhara DOHS,Niketan',
    'Hazaribagh':'Hazaribagh,Rayer Bazar',
    'Jatrabari':'Jatrabari,Dania,Kajla,Sign Board,Shanir Akhra,Doaripara',
    'Kadamtali':'Kadamtali,Jurain',
    'Kafrul':'Kafrul,Ahmednagar,Ibrahimpur',
    'Kalabagan':'Kalabagan,Panthapath,Green Road,Elephant Road',
    'Kamrangirchar':'Kamrangirchar,Islambag,Shahidnagar',
    'Khilgaon':'Khilgaon,Goran,Basabo,Meradia,Nandipara,Tilpapara,Chowdhury Para,Sipahibagh',
    'Khilkhet':'Khilkhet,Nikunja 1,Nikunja 2,Kuril,Joarshahara',
    'Kotwali':'Kotwali,Sadarghat,Babubazar,Shyambazar',
    'Lalbagh':'Lalbagh,Azimpur,Posta,Nazimuddin Road,Dhakeshwari',
    'Mirpur':'Mirpur 6,Mirpur 7,Mirpur 10,Mirpur 11,Mirpur 12,Mirpur 13,Mirpur 14,Mirpur DOHS,Monipur,Bangla College',
    'Mohammadpur':'Mohammadpur,Lalmatia,Tajmahal Road,Asad Gate,Beribadh,Basila,Nurjahan Road,Japan Garden City,Town Hall,Katasur,Jakir Hossain Road',
    'Motijheel':'Motijheel C/A,Dilkusha,Arambagh,Fakirapool,Kamlapur,Shapla Chattar',
    'Mugda':'Mugda,Mugdapara,Maniknagar',
    'New Market':'New Market,Nilkhet,Dhaka College,Bata Signal',
    'Pallabi':'Pallabi,Kalshi,Rupnagar,Senpara Parbata',
    'Paltan':'Paltan,Purana Paltan,Naya Paltan,Kakrail,Bijoynagar,Segunbagicha,Shantinagar',
    'Ramna':'Ramna,Eskaton,Moghbazar,Siddheswari,Bailey Road,Minto Road',
    'Rampura':'Rampura,West Rampura,East Rampura,Banasree,Malibagh,Aftabnagar,Hatirjheel',
    'Sabujbagh':'Sabujbagh,Madartek',
    'Shah Ali':'Shah Ali Bagh,Mazar Road,Mirpur 1,Mirpur 2',
    'Shahbagh':'Shahbagh,Dhaka University,Hatirpool,Bangla Motor,Katabon',
    'Shahjahanpur':'Shahjahanpur,Gopibagh',
    'Sher-e-Bangla Nagar':'Sher-e-Bangla Nagar,Agargaon,Taltola,Bijoy Sarani,Manik Mia Avenue',
    'Shyampur':'Shyampur,Dholaipar,Postogola',
    'Sutrapur':'Sutrapur,Wari,Armanitola,Shankhari Bazar,Dholaikhal,Farashganj,Bangla Bazar,Narinda',
    'Tejgaon':'Tejgaon,Tejgaon Industrial Area,Karwan Bazar,Farmgate,Nakhalpara,Tejkunipara,Mohakhali',
    'Turag':'Turag,Kamarpara,Uttara Sector 17,Uttara Sector 18,Diabari',
    'Uttar Khan':'Uttar Khan,Dumni',
    'Uttara East':'Uttara Sector 1,Uttara Sector 3,Uttara Sector 4,Uttara Sector 5,Uttara Sector 6,Uttara Sector 7,Uttara Sector 9,Uttara Sector 10,Uttara Sector 11,Uttara Sector 12,Uttara Sector 13,Uttara Sector 14',
    'Uttara West':'Azampur,Abdullahpur,Rajlokkhi,House Building,Jashimuddin,Uttara Sector 15,Uttara Sector 16',
    'Vatara':'Vatara,Bashundhara R/A,Notun Bazar,Jamuna Future Park,Pragati Sarani',
    /* — rest of Dhaka district (outside Dhaka delivery) — */
    'Savar':'Savar Bazar,Savar Cantonment,Ashulia,Hemayetpur,Birulia,Nabinagar,Genda,Bank Town,Jahangirnagar University,EPZ',
    'Dhamrai':'Dhamrai,Kulla,Nayarhat',
    'Keraniganj':'Keraniganj,Aganagar,Zinzira,Kalatia,Hazratpur,Konda',
    'Dakshin Keraniganj':'Taranagar,Kaliganj Bazar,Sakta',
    'Nawabganj':'Nawabganj,Dohar Road,Bandura',
    'Dohar':'Dohar,Joypara,Narisha'
  });

  /* ───────────────────────── MAJOR CITIES (with areas) ───────────────────────── */
  L['Chattogram']=M(D({
    'Kotwali':'Kotwali,Anderkilla,Dampara,Jamal Khan,Firingi Bazar,Laldighi,Reazuddin Bazar,Station Road',
    'Panchlaish':'Panchlaish,GEC Circle,Nasirabad,O.R. Nizam Road,Mehedibagh',
    'Khulshi':'Khulshi,Zakir Hossain Road,Lalkhan Bazar,Foy\'s Lake,Jalalabad',
    'Double Mooring':'Double Mooring,Agrabad,Sheikh Mujib Road',
    'Akbar Shah':'Akbar Shah,Firoz Shah Colony,Sholoshahar',
    'Bakalia':'Bakalia,Chaktai,Kapasgola,Dewan Bazar',
    'Chandgaon':'Chandgaon,Bahaddarhat,Muradpur,Mohra',
    'Pahartali':'Pahartali,Alankar,Railway Colony',
    'Halishahar':'Halishahar,Dewanhat',
    'Bayazid':'Bayazid,Oxygen',
    'Chawkbazar':'Chawkbazar,Rahattarpul',
    'Patenga':'Patenga,Patenga Sea Beach,Airport',
    'Bandar':'Bandar,Port',
    'Karnaphuli':'Karnaphuli,Chattogram EPZ'
  }),Z('Anwara,Banshkhali,Boalkhali,Chandanaish,Fatikchhari,Hathazari,Lohagara,Mirsharai,Patiya,Rangunia,Raozan,Sandwip,Satkania,Sitakunda'));

  L['Sylhet']=M(D({
    'Sylhet Sadar':'Zindabazar,Ambarkhana,Bandarbazar,Subid Bazar,Chowhatta,Pathantula,Naiorpul,Kumarpara,Upashahar,Shibganj,Mirboxtula,Tilagor,Rikabi Bazar,Akhalia,Moglabazar,Subhanighat,Dargah Gate,Lamabazar,Shahporan,Airport Road'
  }),Z('Balaganj,Beanibazar,Bishwanath,Companiganj,Dakshin Surma,Fenchuganj,Golapganj,Gowainghat,Jaintiapur,Kanaighat,Osmani Nagar,Zakiganj'));

  L['Rajshahi']=M(D({
    'Boalia':'Shaheb Bazar,Zero Point,Laxmipur,Ghoramara,Kazla,Alupatti,Court Station',
    'Rajpara':'Rajpara,Talaimari,Shiroil',
    'Motihar':'Motihar,Binodpur,Nawdapara,Rajshahi University',
    'Shah Makhdum':'Shah Makhdum,Padma Residential Area,Vadra'
  }),Z('Bagha,Bagmara,Charghat,Durgapur,Godagari,Mohanpur,Paba,Puthia,Tanore'));

  L['Khulna']=M(D({
    'Khulna Sadar':'Boyra,Moylapota,Shibbari,KDA Avenue,Nirala,Tootpara,Sheikhpara',
    'Sonadanga':'Sonadanga,Gollamari',
    'Khalishpur':'Khalishpur,Mujgunni',
    'Daulatpur':'Daulatpur,Shiromoni'
  }),Z('Khan Jahan Ali,Harintana,Labanchara,Aranghata,Batiaghata,Dacope,Dighalia,Dumuria,Koyra,Paikgachha,Phultala,Rupsha,Terokhada'));

  L['Barishal']=M(D({
    'Barishal Sadar':'Sadar Road,Nathullabad,Rupatali,Kashipur,Band Road,Launch Ghat,Bells Park'
  }),Z('Agailjhara,Babuganj,Bakerganj,Banaripara,Gaurnadi,Hizla,Mehendiganj,Muladi,Wazirpur'));

  L['Rangpur']=M(D({
    'Rangpur Sadar':'Modern Mor,Jahaj Company Mor,Dhap,Lalbagh,Station Road,Guptapara,Mahiganj'
  }),Z('Badarganj,Gangachara,Kaunia,Mithapukur,Pirgachha,Pirganj,Taraganj'));

  L['Mymensingh']=M(D({
    'Mymensingh Sadar':'Ganginarpar,Charpara,Kachijhuli,Mashkanda,Town Hall,Akua'
  }),Z('Bhaluka,Dhobaura,Fulbaria,Gaffargaon,Gauripur,Haluaghat,Ishwarganj,Muktagachha,Nandail,Phulpur,Tarakanda,Trishal'));

  L['Cumilla']=M(D({
    'Cumilla Sadar':'Kandirpar,Tomsom Bridge,Rajganj,Chawkbazar,Race Course,Kotbari,Jhawtala'
  }),Z('Cumilla Sadar Dakshin,Adarsha Sadar,Barura,Brahmanpara,Burichang,Chandina,Chauddagram,Daudkandi,Debidwar,Homna,Laksam,Lalmai,Meghna,Monohargonj,Muradnagar,Nangalkot,Titas'));

  L['Gazipur']=M(D({
    'Gazipur Sadar':'Joydebpur,Chandana Chowrasta,Board Bazar,Gacha,Pubail',
    'Tongi':'Tongi Bazar,Station Road,Dattapara,Ershad Nagar,Mill Gate,Tongi College Gate',
    'Konabari':'Konabari',
    'Basan':'Basan',
    'Kaliakair':'Kaliakair,Chandra,Mouchak'
  }),Z('Kaliganj,Kapasia,Sreepur'));

  L['Narayanganj']=M(D({
    'Narayanganj Sadar':'Chashara,Tanbazar,Panchabati,Nitaiganj,Khanpur',
    'Fatullah':'Fatullah,Kashipur,Pagla',
    'Siddhirganj':'Siddhirganj,Godnail,Adamjee Nagar,Shimrail',
    'Bandar':'Bandar,Madanpur',
    'Rupganj':'Rupganj,Kanchan,Bhulta,Murapara,Tarabo',
    'Sonargaon':'Sonargaon,Mograpara,Baidyer Bazar,Panam Nagar'
  }),Z('Araihazar'));

  /* ───────────────────────── OTHER DISTRICTS (zone = upazila / thana) ───────────────────────── */
  L['Bagerhat']=Z('Bagerhat Sadar,Chitalmari,Fakirhat,Kachua,Mollahat,Mongla,Morrelganj,Rampal,Sarankhola');
  L['Bandarban']=Z('Bandarban Sadar,Ali Kadam,Lama,Naikhongchhari,Rowangchhari,Ruma,Thanchi');
  L['Barguna']=Z('Barguna Sadar,Amtali,Bamna,Betagi,Patharghata,Taltali');
  L['Bhola']=Z('Bhola Sadar,Burhanuddin,Char Fasson,Daulatkhan,Lalmohan,Manpura,Tazumuddin');
  L['Bogura']=M(D({'Bogura Sadar':'Satmatha,Thonthonia,Jaleshwaritala,Chelopara,Borogola'}),Z('Adamdighi,Dhunat,Dhupchanchia,Gabtali,Kahaloo,Nandigram,Sariakandi,Shajahanpur,Sherpur,Shibganj,Sonatala'));
  L['Brahmanbaria']=Z('Brahmanbaria Sadar,Akhaura,Ashuganj,Bancharampur,Bijoynagar,Kasba,Nabinagar,Nasirnagar,Sarail');
  L['Chandpur']=Z('Chandpur Sadar,Faridganj,Haimchar,Haziganj,Kachua,Matlab Dakshin,Matlab Uttar,Shahrasti');
  L['Chapainawabganj']=Z('Chapainawabganj Sadar,Bholahat,Gomastapur,Nachole,Shibganj');
  L['Chuadanga']=Z('Chuadanga Sadar,Alamdanga,Damurhuda,Jibannagar');
  L['Cox\'s Bazar']=M(D({'Cox\'s Bazar Sadar':'Kolatoli,Laboni Beach,Sugandha Point,Jhilongja,Link Road,Bazarghata,Hotel Motel Zone'}),Z('Chakaria,Kutubdia,Maheshkhali,Pekua,Ramu,Teknaf,Ukhia'));
  L['Dinajpur']=Z('Dinajpur Sadar,Birampur,Birganj,Biral,Bochaganj,Chirirbandar,Fulbari,Ghoraghat,Hakimpur,Kaharole,Khansama,Nawabganj,Parbatipur');
  L['Faridpur']=Z('Faridpur Sadar,Alfadanga,Bhanga,Boalmari,Charbhadrasan,Madhukhali,Nagarkanda,Sadarpur,Saltha');
  L['Feni']=Z('Feni Sadar,Chhagalnaiya,Daganbhuiyan,Fulgazi,Parshuram,Sonagazi');
  L['Gaibandha']=Z('Gaibandha Sadar,Fulchhari,Gobindaganj,Palashbari,Sadullapur,Saghata,Sundarganj');
  L['Gopalganj']=Z('Gopalganj Sadar,Kashiani,Kotalipara,Muksudpur,Tungipara');
  L['Habiganj']=Z('Habiganj Sadar,Ajmiriganj,Bahubal,Baniachong,Chunarughat,Lakhai,Madhabpur,Nabiganj,Shayestaganj');
  L['Jamalpur']=Z('Jamalpur Sadar,Baksiganj,Dewanganj,Islampur,Madarganj,Melandaha,Sarishabari');
  L['Jashore']=M(D({'Jashore Sadar':'Doratana,Chanchra,Upashahar,Rail Gate,Khajura'}),Z('Abhaynagar,Bagherpara,Chaugachha,Jhikargachha,Keshabpur,Manirampur,Sharsha'));
  L['Jhalokathi']=Z('Jhalokathi Sadar,Kathalia,Nalchity,Rajapur');
  L['Jhenaidah']=Z('Jhenaidah Sadar,Harinakunda,Kaliganj,Kotchandpur,Maheshpur,Shailkupa');
  L['Joypurhat']=Z('Joypurhat Sadar,Akkelpur,Kalai,Khetlal,Panchbibi');
  L['Khagrachhari']=Z('Khagrachhari Sadar,Dighinala,Guimara,Lakshmichhari,Mahalchhari,Manikchhari,Matiranga,Panchhari,Ramgarh');
  L['Kishoreganj']=Z('Kishoreganj Sadar,Austagram,Bajitpur,Bhairab,Hossainpur,Itna,Karimganj,Katiadi,Kuliarchar,Mithamain,Nikli,Pakundia,Tarail');
  L['Kurigram']=Z('Kurigram Sadar,Bhurungamari,Char Rajibpur,Chilmari,Phulbari,Nageshwari,Rajarhat,Raomari,Ulipur');
  L['Kushtia']=Z('Kushtia Sadar,Bheramara,Daulatpur,Khoksa,Kumarkhali,Mirpur');
  L['Lakshmipur']=Z('Lakshmipur Sadar,Komol Nagar,Raipur,Ramganj,Ramgati');
  L['Lalmonirhat']=Z('Lalmonirhat Sadar,Aditmari,Hatibandha,Kaliganj,Patgram');
  L['Madaripur']=Z('Madaripur Sadar,Kalkini,Rajoir,Shibchar');
  L['Magura']=Z('Magura Sadar,Mohammadpur,Shalikha,Sreepur');
  L['Manikganj']=Z('Manikganj Sadar,Daulatpur,Ghior,Harirampur,Saturia,Shivalaya,Singair');
  L['Meherpur']=Z('Meherpur Sadar,Gangni,Mujibnagar');
  L['Moulvibazar']=Z('Moulvibazar Sadar,Barlekha,Juri,Kamalganj,Kulaura,Rajnagar,Sreemangal');
  L['Munshiganj']=Z('Munshiganj Sadar,Gazaria,Lohajang,Sirajdikhan,Sreenagar,Tongibari');
  L['Naogaon']=Z('Naogaon Sadar,Atrai,Badalgachhi,Dhamoirhat,Manda,Mohadevpur,Niamatpur,Patnitala,Porsha,Raninagar,Sapahar');
  L['Narail']=Z('Narail Sadar,Kalia,Lohagara');
  L['Narsingdi']=Z('Narsingdi Sadar,Belabo,Monohardi,Palash,Raipura,Shibpur');
  L['Natore']=Z('Natore Sadar,Bagatipara,Baraigram,Gurudaspur,Lalpur,Naldanga,Singra');
  L['Netrokona']=Z('Netrokona Sadar,Atpara,Barhatta,Durgapur,Kalmakanda,Kendua,Khaliajuri,Madan,Mohanganj,Purbadhala');
  L['Nilphamari']=Z('Nilphamari Sadar,Dimla,Domar,Jaldhaka,Kishoreganj,Saidpur');
  L['Noakhali']=Z('Noakhali Sadar,Begumganj,Chatkhil,Companiganj,Hatiya,Kabirhat,Senbagh,Sonaimuri,Subarnachar');
  L['Pabna']=Z('Pabna Sadar,Atgharia,Bera,Bhangura,Chatmohar,Faridpur,Ishwardi,Santhia,Sujanagar');
  L['Panchagarh']=Z('Panchagarh Sadar,Atwari,Boda,Debiganj,Tentulia');
  L['Patuakhali']=Z('Patuakhali Sadar,Bauphal,Dashmina,Dumki,Galachipa,Kalapara,Mirzaganj,Rangabali');
  L['Pirojpur']=Z('Pirojpur Sadar,Bhandaria,Kawkhali,Mathbaria,Nazirpur,Nesarabad,Zianagar');
  L['Rajbari']=Z('Rajbari Sadar,Baliakandi,Goalanda,Kalukhali,Pangsha');
  L['Rangamati']=Z('Rangamati Sadar,Baghaichhari,Barkal,Belaichhari,Juraichhari,Kaptai,Kawkhali,Langadu,Naniarchar,Rajasthali');
  L['Satkhira']=Z('Satkhira Sadar,Assasuni,Debhata,Kalaroa,Kaliganj,Shyamnagar,Tala');
  L['Shariatpur']=Z('Shariatpur Sadar,Bhedarganj,Damudya,Gosairhat,Naria,Zanjira');
  L['Sherpur']=Z('Sherpur Sadar,Jhenaigati,Nakla,Nalitabari,Sreebardi');
  L['Sirajganj']=Z('Sirajganj Sadar,Belkuchi,Chauhali,Kamarkhanda,Kazipur,Raiganj,Shahjadpur,Tarash,Ullahpara');
  L['Sunamganj']=Z('Sunamganj Sadar,Bishwamvarpur,Chhatak,Dakshin Sunamganj,Derai,Dharampasha,Dowarabazar,Jagannathpur,Jamalganj,Madhyanagar,Sullah,Tahirpur');
  L['Tangail']=Z('Tangail Sadar,Basail,Bhuapur,Delduar,Dhanbari,Ghatail,Gopalpur,Kalihati,Madhupur,Mirzapur,Nagarpur,Sakhipur');
  L['Thakurgaon']=Z('Thakurgaon Sadar,Baliadangi,Haripur,Pirganj,Ranisankail');

  window.ESSENTRA_LOCATIONS=L;
  // Zones of Dhaka DISTRICT that are NOT Dhaka city → "Outside Dhaka" delivery charge
  window.ESSENTRA_OUTSIDE_DHAKA_ZONES=['Savar','Dhamrai','Keraniganj','Dakshin Keraniganj','Nawabganj','Dohar'];
})();
