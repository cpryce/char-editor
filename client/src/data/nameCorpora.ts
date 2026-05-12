import type { Race, Gender } from '../types/character';

const CORPORA: Record<Race, Record<'Male' | 'Female', string[]>> = {
  Human: {
    Male: [
      'Aldric', 'Aldwin', 'Aldarin', 'Balric', 'Brennus', 'Brennan', 'Caelan',
      'Cedric', 'Corvus', 'Darian', 'Davan', 'Dorian', 'Edmund', 'Edric',
      'Evander', 'Faolan', 'Faric', 'Fareth', 'Gareth', 'Garen', 'Gorin',
      'Hadric', 'Halric', 'Henrik', 'Irvin', 'Isak', 'Ivar', 'Jareth',
      'Jerric', 'Jorin', 'Kaelin', 'Kiran', 'Koran', 'Leoric', 'Loric',
      'Lucan', 'Marden', 'Maric', 'Morric', 'Nilan', 'Nolan', 'Noric',
      'Osric', 'Oswin', 'Orin', 'Perrin', 'Pravin', 'Quentin', 'Quinlan',
      'Roland', 'Roran', 'Roric', 'Seric', 'Stefan', 'Syric', 'Taran',
      'Tobias', 'Toric', 'Ulric', 'Urven', 'Vance', 'Varic', 'Varin',
      'Warden', 'Warric', 'Weric',
    ],
    Female: [
      'Alara', 'Alene', 'Alys', 'Bria', 'Branna', 'Brenna', 'Cayla',
      'Celia', 'Clara', 'Dalia', 'Dara', 'Diana', 'Elara', 'Elen', 'Elia',
      'Fara', 'Fayla', 'Fiona', 'Gara', 'Genna', 'Gwenn', 'Hana', 'Hara',
      'Helia', 'Ilara', 'Iona', 'Isla', 'Jana', 'Jara', 'Jora', 'Kaela',
      'Kala', 'Kira', 'Lara', 'Lena', 'Lyra', 'Mara', 'Mela', 'Mina',
      'Nara', 'Nessa', 'Nina', 'Ora', 'Orla', 'Orsa', 'Petra', 'Raea',
      'Rala', 'Rina', 'Sala', 'Sera', 'Sira', 'Tala', 'Tara', 'Tina',
      'Uma', 'Ula', 'Una', 'Vara', 'Vaya', 'Vera', 'Wara', 'Wren', 'Wyna',
    ],
  },

  Elf: {
    Male: [
      'Aelar', 'Aelindor', 'Aerindel', 'Araviel', 'Beiro', 'Caelmir',
      'Caladrel', 'Caladorn', 'Carric', 'Caelar', 'Dayereth', 'Faenor',
      'Faenmir', 'Fenarel', 'Fenmir', 'Galaeron', 'Galanodel', 'Galadorn',
      'Galanmir', 'Hadarai', 'Ilaethor', 'Ilaenor', 'Ilbryn', 'Immeral',
      'Jelenneth', 'Keyleth', 'Laucian', 'Loramil', 'Lorathel', 'Lorindel',
      'Mindartis', 'Mirathor', 'Miramir', 'Naevys', 'Naevindor', 'Naeris',
      'Orindel', 'Orithel', 'Orophir', 'Paelias', 'Phaelindor', 'Phaeros',
      'Quarion', 'Quarathel', 'Quillathe', 'Raevendor', 'Raelen', 'Riardon',
      'Sildar', 'Silvandel', 'Soveliss', 'Thaelindor', 'Thalindor', 'Thamior',
      'Vaelimir', 'Vaelindor', 'Varis',
    ],
    Female: [
      'Adrie', 'Aelindra', 'Aerindra', 'Birel', 'Caelindra', 'Caelynn',
      'Dara', 'Enna', 'Faenwyn', 'Faenindra', 'Faral', 'Galadria',
      'Galandria', 'Galinndan', 'Ilaindra', 'Iliriel', 'Isilindra',
      'Jelenneth', 'Keyleth', 'Liriel', 'Loraindra', 'Lorendis', 'Mirael',
      'Miraindra', 'Miravel', 'Naevara', 'Naevindra', 'Naivara', 'Orophin',
      'Orindra', 'Pharalind', 'Pharindra', 'Quelenna', 'Quelindra',
      'Quillindra', 'Raelindra', 'Raelwyn', 'Sariel', 'Silindra', 'Thaelindra',
      'Thalandria', 'Thalindra', 'Vadania', 'Vaelindra', 'Vaelwyn', 'Valanthe',
    ],
  },

  Dwarf: {
    Male: [
      'Aldrak', 'Artin', 'Audhild', 'Balin', 'Barendd', 'Bifur', 'Bofri',
      'Bolg', 'Bolin', 'Bombur', 'Brambor', 'Brottor', 'Bruenor', 'Carrak',
      'Dain', 'Darrak', 'Delg', 'Dolgrin', 'Dolgran', 'Dori', 'Dwalin',
      'Eberk', 'Fargrim', 'Fili', 'Flint', 'Gardain', 'Gloin', 'Gurdis',
      'Hamirst', 'Harbek', 'Ilrund', 'Jorn', 'Kildrak', 'Kili', 'Lugrok',
      'Maulkin', 'Mordan', 'Norn', 'Nori', 'Oin', 'Ori', 'Orsik', 'Pergum',
      'Ragnuk', 'Rurik', 'Storvald', 'Taklinn', 'Thoradin', 'Thorin',
      'Tordek', 'Traubon', 'Travok', 'Ulfgar', 'Veit',
    ],
    Female: [
      'Amber', 'Artin', 'Audhild', 'Bardryn', 'Branda', 'Cinda', 'Dagna',
      'Dagnal', 'Dagny', 'Diesa', 'Edda', 'Eldeth', 'Falkrunn', 'Filda',
      'Gilda', 'Golda', 'Gunnloda', 'Gurdis', 'Helda', 'Helja', 'Helga',
      'Hilda', 'Hlin', 'Ilda', 'Ilde', 'Inga', 'Irgda', 'Jilda', 'Kathra',
      'Kelda', 'Kilda', 'Kristryd', 'Liftrasa', 'Linda', 'Mardred', 'Milda',
      'Nilda', 'Olda', 'Pilda', 'Ragna', 'Riswynn', 'Sannl', 'Sigrid',
      'Svala', 'Thora', 'Torbera', 'Torgga', 'Ulfhild', 'Vegdis', 'Vistra',
    ],
  },

  Gnome: {
    Male: [
      'Alston', 'Alus', 'Boddynock', 'Bofur', 'Borin', 'Brocc', 'Coggin',
      'Dimble', 'Dimlis', 'Erky', 'Ettins', 'Finnan', 'Finkle', 'Fonkin',
      'Gerbo', 'Gilfur', 'Gizzle', 'Glim', 'Higgle', 'Ignus', 'Inkle',
      'Jebeddo', 'Jinkle', 'Kellen', 'Kelrin', 'Kinkle', 'Lavid', 'Lenup',
      'Linkle', 'Mimis', 'Minkle', 'Mott', 'Nevit', 'Nif', 'Ninkle',
      'Orren', 'Orryn', 'Pock', 'Pinkle', 'Quaff', 'Quinkle', 'Renbuu',
      'Rinkle', 'Rondo', 'Scheppen', 'Seebo', 'Sindri', 'Sinkle', 'Tinkle',
      'Umpen', 'Waywocket', 'Wim', 'Zook',
    ],
    Female: [
      'Alira', 'Bimpnit', 'Bimpnottin', 'Carali', 'Caramip', 'Dimpra',
      'Dimple', 'Duvamil', 'Ellyjobell', 'Ellyril', 'Eriti', 'Fyndla',
      'Fyndril', 'Garnet', 'Garril', 'Hazel', 'Hazril', 'Ilde', 'Ildril',
      'Jinnawy', 'Jinril', 'Kirra', 'Kirril', 'Lilli', 'Lilril', 'Mimble',
      'Mimril', 'Nevil', 'Nevril', 'Opel', 'Opril', 'Penny', 'Penril',
      'Rosie', 'Rosril', 'Sibby', 'Sibril', 'Tippi', 'Tipril', 'Virna',
      'Wishy', 'Zara',
    ],
  },

  Halfling: {
    Male: [
      'Adalbert', 'Alton', 'Andry', 'Baldo', 'Beau', 'Bilbo', 'Cade',
      'Caramoc', 'Cas', 'Corrin', 'Dankin', 'Dodinas', 'Drogo', 'Eldon',
      'Elmo', 'Everard', 'Falco', 'Frobas', 'Garret', 'Gerontius', 'Gorbadoc',
      'Hal', 'Hamlet', 'Hamfast', 'Isembard', 'Isumbras', 'Jedidiah', 'Jolly',
      'Kelson', 'Kolo', 'Largo', 'Longo', 'Lyle', 'Meriadoc', 'Merry',
      'Milo', 'Mungo', 'Nedder', 'Nob', 'Noddin', 'Odo', 'Osborn', 'Perrin',
      'Pippin', 'Ponto', 'Rolan', 'Rorimac', 'Rudi', 'Sam', 'Seraphim',
      'Tobold', 'Tobrin', 'Uffo', 'Ulmo', 'Vigo', 'Welby', 'Willin', 'Zeb',
    ],
    Female: [
      'Adalina', 'Adeline', 'Aleesha', 'Begonia', 'Belladonna', 'Bree',
      'Callie', 'Camellia', 'Cora', 'Daisy', 'Delphinia', 'Dina', 'Eglantine',
      'Esme', 'Eula', 'Finni', 'Fosco', 'Foxglove', 'Gehra', 'Gentiana',
      'Glori', 'Heather', 'Henna', 'Hera', 'Iris', 'Jade', 'Jemima',
      'Jessamine', 'Kari', 'Kiora', 'Larna', 'Lily', 'Margo', 'Marigold',
      'Nina', 'Nora', 'Olive', 'Opal', 'Pearl', 'Peri', 'Rosa', 'Ruby',
      'Sadie', 'Susanna', 'Tilly', 'Tina', 'Uma', 'Vada', 'Vina', 'Willa',
      'Winna',
    ],
  },

  'Half-Elf': {
    Male: [
      'Aelric', 'Aerindel', 'Aldaen', 'Aramil', 'Beiro', 'Brendaen',
      'Caeldric', 'Caelwin', 'Carric', 'Daereth', 'Darvyn', 'Edaen',
      'Erdan', 'Faeldric', 'Faeloric', 'Gaelric', 'Garethin', 'Haeldric',
      'Haldric', 'Iallanis', 'Ilindric', 'Immeral', 'Jaelan', 'Jarial',
      'Kaelric', 'Keyleth', 'Laerothian', 'Lorindric', 'Maelric', 'Mialee',
      'Naelric', 'Naeris', 'Oaelric', 'Peren', 'Phaelric', 'Quelenna',
      'Raelric', 'Riardon', 'Saelric', 'Sariel', 'Thaelric', 'Tharivol',
      'Ulaire', 'Vaelric', 'Varis', 'Waelric',
    ],
    Female: [
      'Adrie', 'Aelindra', 'Alara', 'Birel', 'Brenna', 'Caelwyn', 'Caelynn',
      'Dara', 'Elara', 'Enna', 'Faenwyn', 'Faral', 'Galinndan', 'Genna',
      'Helia', 'Iliriel', 'Isilindra', 'Jelenneth', 'Jora', 'Kaylessa',
      'Keyleth', 'Liriel', 'Lorendis', 'Lyra', 'Mirael', 'Naevara', 'Naela',
      'Naivara', 'Nessa', 'Quelenna', 'Raelindra', 'Sariel', 'Sira',
      'Thalindra', 'Ulaire', 'Vadania', 'Vaelwyn', 'Valanthe', 'Vera',
      'Veralindra', 'Wren', 'Zephyrine',
    ],
  },

  'Half-Orc': {
    Male: [
      'Agrak', 'Azog', 'Bolg', 'Bruth', 'Dorg', 'Golbag', 'Gorbag',
      'Grath', 'Grimm', 'Grishnak', 'Groma', 'Grugrak', 'Karg', 'Krog',
      'Krodrak', 'Lugburz', 'Lugdush', 'Lurg', 'Mauhur', 'Mordrak', 'Mord',
      'Morg', 'Muzgash', 'Narg', 'Orgul', 'Parg', 'Radbug', 'Rork',
      'Shagrat', 'Snaga', 'Sorg', 'Thorg', 'Thrak', 'Thrakrul', 'Ufthak',
      'Ugluk', 'Urgal', 'Vorg', 'Vorgrul', 'Vragg', 'Worg', 'Zrug', 'Zrugrul',
    ],
    Female: [
      'Agna', 'Brutha', 'Dorga', 'Grima', 'Grimma', 'Groma', 'Karga',
      'Kroga', 'Krolga', 'Lurga', 'Morda', 'Morga', 'Mordra', 'Narga',
      'Orgula', 'Parga', 'Rorka', 'Sorga', 'Thraka', 'Thrakra', 'Thorga',
      'Urgala', 'Vorga', 'Vorgra', 'Vraggis', 'Worga', 'Xorga', 'Yorga',
      'Zargas', 'Zruga', 'Zrugra',
    ],
  },
};

const SURNAME_CORPORA: Record<Race, string[]> = {
  Human: [
    'Ashford', 'Briar', 'Caldwell', 'Dunwell', 'Eldridge', 'Fairborn',
    'Garrick', 'Hawthorne', 'Ironwood', 'Kestrel', 'Langley', 'Merrick',
    'Northcott', 'Pryce', 'Ravenshade', 'Stone', 'Thorne', 'Westfall',
  ],
  Elf: [
    'Amakiir', 'Amastacia', 'Celebren', 'Dalanthan', 'Erenaeth', 'Galanodel',
    'Holimion', 'Ilphelkiir', 'Liadon', 'Meliamne', 'Nailo', 'Siannodel',
    'Xiloscient', 'Yllaphon', 'Elyndor', 'Lethalas',
  ],
  Dwarf: [
    'Battlehammer', 'Bronzebeard', 'Deepdelver', 'Fireforge', 'Frostbeard',
    'Goldfinder', 'Granitehand', 'Ironfist', 'Kegshield', 'Orebreaker',
    'Rockseeker', 'Stoneshield', 'Strongale', 'Thunderdelve', 'Torchbeard',
    'Underbrow',
  ],
  Gnome: [
    'Beren', 'Cobblehob', 'Daergel', 'Folkor', 'Garrick', 'Murnig',
    'Nackle', 'Ningel', 'Raulnor', 'Scheppen', 'Timbers', 'Turen',
    'Umbodoben', 'Waggletop', 'Wobbledink', 'Zaffrab',
  ],
  Halfling: [
    'Brushgather', 'Goodbarrel', 'Greenbottle', 'Highhill', 'Hilltopple',
    'Leagallow', 'Longbottom', 'Mooncask', 'Proudfoot', 'Quickstep',
    'Rumblebelly', 'Tealeaf', 'Thorngage', 'Tosscobble', 'Underbough',
    'Warmwater',
  ],
  'Half-Elf': [
    'Brightwood', 'Dawnmere', 'Evenwood', 'Farsong', 'Greyvale', 'Moonbrook',
    'Nightbloom', 'Riversong', 'Silverbough', 'Starleaf', 'Sunmere',
    'Thornwillow', 'Umberwind', 'Valewhisper', 'Westgrove', 'Willowmere',
  ],
  'Half-Orc': [
    'Bonecrag', 'Doomtusk', 'Embermaw', 'Grimscar', 'Ironjaw', 'Maneater',
    'Rageborn', 'Rendhide', 'Skullcleaver', 'Skullsplitter', 'Stonefang',
    'Thundermaw', 'Urgash', 'Warskull', 'Wolftooth', 'Zargrul',
  ],
};

/** Returns the name corpus for the given race and gender.
 *  'Gender Neutral' blends the Male and Female corpora. */
export function getCorpus(race: Race, gender: Gender): string[] {
  const entry = CORPORA[race];
  if (gender === 'Gender Neutral') {
    return [...entry.Male, ...entry.Female];
  }
  return entry[gender];
}

/** Returns surname corpus for the given race. */
export function getSurnameCorpus(race: Race): string[] {
  return SURNAME_CORPORA[race];
}
