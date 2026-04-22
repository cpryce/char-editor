# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: character-editor.spec.ts >> Character Editor >> Layout >> shows Ability Score rows (STR, DEX, CON, INT, WIS, CHA)
- Location: e2e/character-editor.spec.ts:37:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('STR', { exact: true })
Expected: visible
Error: strict mode violation: getByText('STR', { exact: true }) resolved to 4 elements:
    1) <span class="w-8 text-xs font-semibold">STR</span> aka locator('span').filter({ hasText: 'STR' })
    2) <td class="px-3 py-1">STR</td> aka getByRole('cell', { name: 'STR' }).first()
    3) <td class="px-3 py-1">STR</td> aka getByRole('cell', { name: 'STR' }).nth(1)
    4) <td class="px-3 py-1">STR</td> aka getByRole('cell', { name: 'STR' }).nth(2)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('STR', { exact: true })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]: char-editor
    - button "Test User ▾" [ref=e7] [cursor=pointer]:
      - generic [ref=e8]: Test User
      - generic [ref=e9]: ▾
  - generic [ref=e10]:
    - navigation [ref=e11]:
      - generic [ref=e12]: Menu
      - list [ref=e13]:
        - listitem [ref=e14]:
          - button "Characters" [ref=e15] [cursor=pointer]
        - listitem [ref=e16]:
          - button "Custom Skills" [disabled] [ref=e17]
        - listitem [ref=e18]:
          - button "Custom Feats" [disabled] [ref=e19]
    - main [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]:
          - heading "New Character" [level=2] [ref=e23]
          - button "Cancel" [ref=e24] [cursor=pointer]
        - generic [ref=e25]:
          - heading "Identity" [level=3] [ref=e26]
          - generic [ref=e27]:
            - generic [ref=e28]:
              - generic [ref=e29]: Name*
              - textbox "Name*" [ref=e30]:
                - /placeholder: Character name
            - generic [ref=e31]:
              - generic [ref=e32]: Gender
              - combobox "Gender" [ref=e33]:
                - option "male" [selected]
                - option "female"
                - option "other"
            - generic [ref=e34]:
              - generic [ref=e35]: Race
              - combobox "Race" [ref=e36]:
                - option "Human" [selected]
                - option "Elf"
                - option "Dwarf"
                - option "Gnome"
                - option "Halfling"
                - option "Half-Elf"
                - option "Half-Orc"
            - generic [ref=e37]:
              - generic [ref=e38]: Alignment
              - combobox "Alignment" [ref=e39]:
                - option "Lawful Good"
                - option "Neutral Good"
                - option "Chaotic Good"
                - option "Lawful Neutral"
                - option "True Neutral" [selected]
                - option "Chaotic Neutral"
                - option "Lawful Evil"
                - option "Neutral Evil"
                - option "Chaotic Evil"
            - generic [ref=e40]:
              - generic [ref=e41]: Size
              - combobox "Size" [ref=e42]:
                - option "Fine"
                - option "Diminutive"
                - option "Tiny"
                - option "Small"
                - option "Medium" [selected]
                - option "Large"
                - option "Huge"
                - option "Gargantuan"
                - option "Colossal"
            - generic [ref=e43]:
              - generic [ref=e44]: Deity
              - textbox "Deity" [ref=e45]
            - generic [ref=e46]:
              - generic [ref=e47]: Age
              - textbox "Age" [ref=e48]:
                - /placeholder: e.g. 25
            - generic [ref=e49]:
              - generic [ref=e50]: Height
              - textbox "Height" [ref=e51]:
                - /placeholder: e.g. 5'10"
            - generic [ref=e52]:
              - generic [ref=e53]: Weight
              - textbox "Weight" [ref=e54]:
                - /placeholder: e.g. 180 lbs
            - generic [ref=e55]:
              - generic [ref=e56]: Eyes
              - textbox "Eyes" [ref=e57]
            - generic [ref=e58]:
              - generic [ref=e59]: Hair
              - textbox "Hair" [ref=e60]
            - generic [ref=e61]:
              - generic [ref=e62]: Skin
              - textbox "Skin" [ref=e63]
          - generic [ref=e64]:
            - generic [ref=e65]: Languages (comma-separated)
            - textbox "Languages (comma-separated)" [ref=e66]:
              - /placeholder: Common, Elvish…
          - heading "Class & Level *" [level=3] [ref=e67]
          - combobox [ref=e69]:
            - option "— Select class —" [selected]
            - option "Barbarian"
            - option "Bard"
            - option "Cleric"
            - option "Druid"
            - option "Fighter"
            - option "Monk"
            - option "Paladin"
            - option "Ranger"
            - option "Rogue"
            - option "Sorcerer"
            - option "Wizard"
          - heading "Ability Scores" [level=3] [ref=e70]
          - generic [ref=e71]:
            - generic [ref=e72]:
              - generic [ref=e73]: STR
              - generic [ref=e74]:
                - generic [ref=e75]: base
                - spinbutton [ref=e76]: "10"
              - generic [ref=e77]:
                - generic [ref=e78]: racial
                - generic [ref=e79]: "0"
              - generic [ref=e80]:
                - generic [ref=e81]: total
                - generic [ref=e82]: "10"
              - generic [ref=e83]:
                - generic [ref=e84]: mod
                - generic [ref=e85]: "+0"
            - generic [ref=e86]:
              - generic [ref=e87]: DEX
              - generic [ref=e88]:
                - generic [ref=e89]: base
                - spinbutton [ref=e90]: "10"
              - generic [ref=e91]:
                - generic [ref=e92]: racial
                - generic [ref=e93]: "0"
              - generic [ref=e94]:
                - generic [ref=e95]: total
                - generic [ref=e96]: "10"
              - generic [ref=e97]:
                - generic [ref=e98]: mod
                - generic [ref=e99]: "+0"
            - generic [ref=e100]:
              - generic [ref=e101]: CON
              - generic [ref=e102]:
                - generic [ref=e103]: base
                - spinbutton [ref=e104]: "10"
              - generic [ref=e105]:
                - generic [ref=e106]: racial
                - generic [ref=e107]: "0"
              - generic [ref=e108]:
                - generic [ref=e109]: total
                - generic [ref=e110]: "10"
              - generic [ref=e111]:
                - generic [ref=e112]: mod
                - generic [ref=e113]: "+0"
            - generic [ref=e114]:
              - generic [ref=e115]: INT
              - generic [ref=e116]:
                - generic [ref=e117]: base
                - spinbutton [ref=e118]: "10"
              - generic [ref=e119]:
                - generic [ref=e120]: racial
                - generic [ref=e121]: "0"
              - generic [ref=e122]:
                - generic [ref=e123]: total
                - generic [ref=e124]: "10"
              - generic [ref=e125]:
                - generic [ref=e126]: mod
                - generic [ref=e127]: "+0"
            - generic [ref=e128]:
              - generic [ref=e129]: WIS
              - generic [ref=e130]:
                - generic [ref=e131]: base
                - spinbutton [ref=e132]: "10"
              - generic [ref=e133]:
                - generic [ref=e134]: racial
                - generic [ref=e135]: "0"
              - generic [ref=e136]:
                - generic [ref=e137]: total
                - generic [ref=e138]: "10"
              - generic [ref=e139]:
                - generic [ref=e140]: mod
                - generic [ref=e141]: "+0"
            - generic [ref=e142]:
              - generic [ref=e143]: CHA
              - generic [ref=e144]:
                - generic [ref=e145]: base
                - spinbutton [ref=e146]: "10"
              - generic [ref=e147]:
                - generic [ref=e148]: racial
                - generic [ref=e149]: "0"
              - generic [ref=e150]:
                - generic [ref=e151]: total
                - generic [ref=e152]: "10"
              - generic [ref=e153]:
                - generic [ref=e154]: mod
                - generic [ref=e155]: "+0"
          - heading "Hit Points" [level=3] [ref=e156]
          - generic [ref=e157]:
            - generic [ref=e158]:
              - generic [ref=e159]: Max HP
              - spinbutton "Max HP" [ref=e160]: "0"
            - generic [ref=e161]:
              - generic [ref=e162]: Current HP
              - spinbutton "Current HP" [ref=e163]: "0"
          - heading "Skills" [level=3] [ref=e164]
          - table [ref=e166]:
            - rowgroup [ref=e167]:
              - row "Skill Key Ability Trained Only ACP Ranks Bonus" [ref=e168]:
                - columnheader "Skill" [ref=e169]
                - columnheader "Key Ability" [ref=e170]
                - columnheader "Trained Only" [ref=e171]
                - columnheader "ACP" [ref=e172]
                - columnheader "Ranks" [ref=e173]
                - columnheader "Bonus" [ref=e174]
            - rowgroup [ref=e175]:
              - row "Appraise INT 0 +0" [ref=e176]:
                - cell "Appraise" [ref=e177]
                - cell "INT" [ref=e178]
                - cell [ref=e179]
                - cell [ref=e180]
                - cell "0" [ref=e181]:
                  - spinbutton [ref=e182]: "0"
                - cell "+0" [ref=e183]
              - row "Balance DEX ✓ 0 +0" [ref=e184]:
                - cell "Balance" [ref=e185]
                - cell "DEX" [ref=e186]
                - cell [ref=e187]
                - cell "✓" [ref=e188]
                - cell "0" [ref=e189]:
                  - spinbutton [ref=e190]: "0"
                - cell "+0" [ref=e191]
              - row "Bluff CHA 0 +0" [ref=e192]:
                - cell "Bluff" [ref=e193]
                - cell "CHA" [ref=e194]
                - cell [ref=e195]
                - cell [ref=e196]
                - cell "0" [ref=e197]:
                  - spinbutton [ref=e198]: "0"
                - cell "+0" [ref=e199]
              - row "Climb STR ✓ 0 +0" [ref=e200]:
                - cell "Climb" [ref=e201]
                - cell "STR" [ref=e202]
                - cell [ref=e203]
                - cell "✓" [ref=e204]
                - cell "0" [ref=e205]:
                  - spinbutton [ref=e206]: "0"
                - cell "+0" [ref=e207]
              - row "Concentration CON 0 +0" [ref=e208]:
                - cell "Concentration" [ref=e209]
                - cell "CON" [ref=e210]
                - cell [ref=e211]
                - cell [ref=e212]
                - cell "0" [ref=e213]:
                  - spinbutton [ref=e214]: "0"
                - cell "+0" [ref=e215]
              - row "Craft INT 0 +0" [ref=e216]:
                - cell "Craft" [ref=e217]
                - cell "INT" [ref=e218]
                - cell [ref=e219]
                - cell [ref=e220]
                - cell "0" [ref=e221]:
                  - spinbutton [ref=e222]: "0"
                - cell "+0" [ref=e223]
              - row "Decipher Script INT ✓ 0 +0" [ref=e224]:
                - cell "Decipher Script" [ref=e225]
                - cell "INT" [ref=e226]
                - cell "✓" [ref=e227]
                - cell [ref=e228]
                - cell "0" [ref=e229]:
                  - spinbutton [ref=e230]: "0"
                - cell "+0" [ref=e231]
              - row "Diplomacy CHA 0 +0" [ref=e232]:
                - cell "Diplomacy" [ref=e233]
                - cell "CHA" [ref=e234]
                - cell [ref=e235]
                - cell [ref=e236]
                - cell "0" [ref=e237]:
                  - spinbutton [ref=e238]: "0"
                - cell "+0" [ref=e239]
              - row "Disable Device INT ✓ 0 +0" [ref=e240]:
                - cell "Disable Device" [ref=e241]
                - cell "INT" [ref=e242]
                - cell "✓" [ref=e243]
                - cell [ref=e244]
                - cell "0" [ref=e245]:
                  - spinbutton [ref=e246]: "0"
                - cell "+0" [ref=e247]
              - row "Disguise CHA 0 +0" [ref=e248]:
                - cell "Disguise" [ref=e249]
                - cell "CHA" [ref=e250]
                - cell [ref=e251]
                - cell [ref=e252]
                - cell "0" [ref=e253]:
                  - spinbutton [ref=e254]: "0"
                - cell "+0" [ref=e255]
              - row "Escape Artist DEX ✓ 0 +0" [ref=e256]:
                - cell "Escape Artist" [ref=e257]
                - cell "DEX" [ref=e258]
                - cell [ref=e259]
                - cell "✓" [ref=e260]
                - cell "0" [ref=e261]:
                  - spinbutton [ref=e262]: "0"
                - cell "+0" [ref=e263]
              - row "Forgery INT 0 +0" [ref=e264]:
                - cell "Forgery" [ref=e265]
                - cell "INT" [ref=e266]
                - cell [ref=e267]
                - cell [ref=e268]
                - cell "0" [ref=e269]:
                  - spinbutton [ref=e270]: "0"
                - cell "+0" [ref=e271]
              - row "Gather Information CHA 0 +0" [ref=e272]:
                - cell "Gather Information" [ref=e273]
                - cell "CHA" [ref=e274]
                - cell [ref=e275]
                - cell [ref=e276]
                - cell "0" [ref=e277]:
                  - spinbutton [ref=e278]: "0"
                - cell "+0" [ref=e279]
              - row "Handle Animal CHA ✓ 0 +0" [ref=e280]:
                - cell "Handle Animal" [ref=e281]
                - cell "CHA" [ref=e282]
                - cell "✓" [ref=e283]
                - cell [ref=e284]
                - cell "0" [ref=e285]:
                  - spinbutton [ref=e286]: "0"
                - cell "+0" [ref=e287]
              - row "Heal WIS 0 +0" [ref=e288]:
                - cell "Heal" [ref=e289]
                - cell "WIS" [ref=e290]
                - cell [ref=e291]
                - cell [ref=e292]
                - cell "0" [ref=e293]:
                  - spinbutton [ref=e294]: "0"
                - cell "+0" [ref=e295]
              - row "Hide DEX ✓ 0 +0" [ref=e296]:
                - cell "Hide" [ref=e297]
                - cell "DEX" [ref=e298]
                - cell [ref=e299]
                - cell "✓" [ref=e300]
                - cell "0" [ref=e301]:
                  - spinbutton [ref=e302]: "0"
                - cell "+0" [ref=e303]
              - row "Intimidate CHA 0 +0" [ref=e304]:
                - cell "Intimidate" [ref=e305]
                - cell "CHA" [ref=e306]
                - cell [ref=e307]
                - cell [ref=e308]
                - cell "0" [ref=e309]:
                  - spinbutton [ref=e310]: "0"
                - cell "+0" [ref=e311]
              - row "Jump STR ✓ 0 +0" [ref=e312]:
                - cell "Jump" [ref=e313]
                - cell "STR" [ref=e314]
                - cell [ref=e315]
                - cell "✓" [ref=e316]
                - cell "0" [ref=e317]:
                  - spinbutton [ref=e318]: "0"
                - cell "+0" [ref=e319]
              - row "Knowledge (arcana) INT ✓ 0 +0" [ref=e320]:
                - cell "Knowledge (arcana)" [ref=e321]
                - cell "INT" [ref=e322]
                - cell "✓" [ref=e323]
                - cell [ref=e324]
                - cell "0" [ref=e325]:
                  - spinbutton [ref=e326]: "0"
                - cell "+0" [ref=e327]
              - row "Knowledge (architecture & engineering) INT ✓ 0 +0" [ref=e328]:
                - cell "Knowledge (architecture & engineering)" [ref=e329]
                - cell "INT" [ref=e330]
                - cell "✓" [ref=e331]
                - cell [ref=e332]
                - cell "0" [ref=e333]:
                  - spinbutton [ref=e334]: "0"
                - cell "+0" [ref=e335]
              - row "Knowledge (dungeoneering) INT ✓ 0 +0" [ref=e336]:
                - cell "Knowledge (dungeoneering)" [ref=e337]
                - cell "INT" [ref=e338]
                - cell "✓" [ref=e339]
                - cell [ref=e340]
                - cell "0" [ref=e341]:
                  - spinbutton [ref=e342]: "0"
                - cell "+0" [ref=e343]
              - row "Knowledge (geography) INT ✓ 0 +0" [ref=e344]:
                - cell "Knowledge (geography)" [ref=e345]
                - cell "INT" [ref=e346]
                - cell "✓" [ref=e347]
                - cell [ref=e348]
                - cell "0" [ref=e349]:
                  - spinbutton [ref=e350]: "0"
                - cell "+0" [ref=e351]
              - row "Knowledge (history) INT ✓ 0 +0" [ref=e352]:
                - cell "Knowledge (history)" [ref=e353]
                - cell "INT" [ref=e354]
                - cell "✓" [ref=e355]
                - cell [ref=e356]
                - cell "0" [ref=e357]:
                  - spinbutton [ref=e358]: "0"
                - cell "+0" [ref=e359]
              - row "Knowledge (local) INT ✓ 0 +0" [ref=e360]:
                - cell "Knowledge (local)" [ref=e361]
                - cell "INT" [ref=e362]
                - cell "✓" [ref=e363]
                - cell [ref=e364]
                - cell "0" [ref=e365]:
                  - spinbutton [ref=e366]: "0"
                - cell "+0" [ref=e367]
              - row "Knowledge (nature) INT ✓ 0 +0" [ref=e368]:
                - cell "Knowledge (nature)" [ref=e369]
                - cell "INT" [ref=e370]
                - cell "✓" [ref=e371]
                - cell [ref=e372]
                - cell "0" [ref=e373]:
                  - spinbutton [ref=e374]: "0"
                - cell "+0" [ref=e375]
              - row "Knowledge (nobility & royalty) INT ✓ 0 +0" [ref=e376]:
                - cell "Knowledge (nobility & royalty)" [ref=e377]
                - cell "INT" [ref=e378]
                - cell "✓" [ref=e379]
                - cell [ref=e380]
                - cell "0" [ref=e381]:
                  - spinbutton [ref=e382]: "0"
                - cell "+0" [ref=e383]
              - row "Knowledge (religion) INT ✓ 0 +0" [ref=e384]:
                - cell "Knowledge (religion)" [ref=e385]
                - cell "INT" [ref=e386]
                - cell "✓" [ref=e387]
                - cell [ref=e388]
                - cell "0" [ref=e389]:
                  - spinbutton [ref=e390]: "0"
                - cell "+0" [ref=e391]
              - row "Knowledge (the planes) INT ✓ 0 +0" [ref=e392]:
                - cell "Knowledge (the planes)" [ref=e393]
                - cell "INT" [ref=e394]
                - cell "✓" [ref=e395]
                - cell [ref=e396]
                - cell "0" [ref=e397]:
                  - spinbutton [ref=e398]: "0"
                - cell "+0" [ref=e399]
              - row "Listen WIS 0 +0" [ref=e400]:
                - cell "Listen" [ref=e401]
                - cell "WIS" [ref=e402]
                - cell [ref=e403]
                - cell [ref=e404]
                - cell "0" [ref=e405]:
                  - spinbutton [ref=e406]: "0"
                - cell "+0" [ref=e407]
              - row "Move Silently DEX ✓ 0 +0" [ref=e408]:
                - cell "Move Silently" [ref=e409]
                - cell "DEX" [ref=e410]
                - cell [ref=e411]
                - cell "✓" [ref=e412]
                - cell "0" [ref=e413]:
                  - spinbutton [ref=e414]: "0"
                - cell "+0" [ref=e415]
              - row "Open Lock DEX ✓ 0 +0" [ref=e416]:
                - cell "Open Lock" [ref=e417]
                - cell "DEX" [ref=e418]
                - cell "✓" [ref=e419]
                - cell [ref=e420]
                - cell "0" [ref=e421]:
                  - spinbutton [ref=e422]: "0"
                - cell "+0" [ref=e423]
              - row "Perform CHA 0 +0" [ref=e424]:
                - cell "Perform" [ref=e425]
                - cell "CHA" [ref=e426]
                - cell [ref=e427]
                - cell [ref=e428]
                - cell "0" [ref=e429]:
                  - spinbutton [ref=e430]: "0"
                - cell "+0" [ref=e431]
              - row "Profession WIS ✓ 0 +0" [ref=e432]:
                - cell "Profession" [ref=e433]
                - cell "WIS" [ref=e434]
                - cell "✓" [ref=e435]
                - cell [ref=e436]
                - cell "0" [ref=e437]:
                  - spinbutton [ref=e438]: "0"
                - cell "+0" [ref=e439]
              - row "Ride DEX 0 +0" [ref=e440]:
                - cell "Ride" [ref=e441]
                - cell "DEX" [ref=e442]
                - cell [ref=e443]
                - cell [ref=e444]
                - cell "0" [ref=e445]:
                  - spinbutton [ref=e446]: "0"
                - cell "+0" [ref=e447]
              - row "Search INT 0 +0" [ref=e448]:
                - cell "Search" [ref=e449]
                - cell "INT" [ref=e450]
                - cell [ref=e451]
                - cell [ref=e452]
                - cell "0" [ref=e453]:
                  - spinbutton [ref=e454]: "0"
                - cell "+0" [ref=e455]
              - row "Sense Motive WIS 0 +0" [ref=e456]:
                - cell "Sense Motive" [ref=e457]
                - cell "WIS" [ref=e458]
                - cell [ref=e459]
                - cell [ref=e460]
                - cell "0" [ref=e461]:
                  - spinbutton [ref=e462]: "0"
                - cell "+0" [ref=e463]
              - row "Sleight of Hand DEX ✓ ✓ 0 +0" [ref=e464]:
                - cell "Sleight of Hand" [ref=e465]
                - cell "DEX" [ref=e466]
                - cell "✓" [ref=e467]
                - cell "✓" [ref=e468]
                - cell "0" [ref=e469]:
                  - spinbutton [ref=e470]: "0"
                - cell "+0" [ref=e471]
              - row "Speak Language 0 ✓ 0 +0" [ref=e472]:
                - cell "Speak Language" [ref=e473]
                - cell "0" [ref=e474]
                - cell "✓" [ref=e475]
                - cell [ref=e476]
                - cell "0" [ref=e477]:
                  - spinbutton [ref=e478]: "0"
                - cell "+0" [ref=e479]
              - row "Spellcraft INT ✓ 0 +0" [ref=e480]:
                - cell "Spellcraft" [ref=e481]
                - cell "INT" [ref=e482]
                - cell "✓" [ref=e483]
                - cell [ref=e484]
                - cell "0" [ref=e485]:
                  - spinbutton [ref=e486]: "0"
                - cell "+0" [ref=e487]
              - row "Spot WIS 0 +0" [ref=e488]:
                - cell "Spot" [ref=e489]
                - cell "WIS" [ref=e490]
                - cell [ref=e491]
                - cell [ref=e492]
                - cell "0" [ref=e493]:
                  - spinbutton [ref=e494]: "0"
                - cell "+0" [ref=e495]
              - row "Survival WIS 0 +0" [ref=e496]:
                - cell "Survival" [ref=e497]
                - cell "WIS" [ref=e498]
                - cell [ref=e499]
                - cell [ref=e500]
                - cell "0" [ref=e501]:
                  - spinbutton [ref=e502]: "0"
                - cell "+0" [ref=e503]
              - row "Swim STR ✓ 0 +0" [ref=e504]:
                - cell "Swim" [ref=e505]
                - cell "STR" [ref=e506]
                - cell [ref=e507]
                - cell "✓" [ref=e508]
                - cell "0" [ref=e509]:
                  - spinbutton [ref=e510]: "0"
                - cell "+0" [ref=e511]
              - row "Tumble DEX ✓ ✓ 0 +0" [ref=e512]:
                - cell "Tumble" [ref=e513]
                - cell "DEX" [ref=e514]
                - cell "✓" [ref=e515]
                - cell "✓" [ref=e516]
                - cell "0" [ref=e517]:
                  - spinbutton [ref=e518]: "0"
                - cell "+0" [ref=e519]
              - row "Use Magic Device CHA ✓ 0 +0" [ref=e520]:
                - cell "Use Magic Device" [ref=e521]
                - cell "CHA" [ref=e522]
                - cell "✓" [ref=e523]
                - cell [ref=e524]
                - cell "0" [ref=e525]:
                  - spinbutton [ref=e526]: "0"
                - cell "+0" [ref=e527]
              - row "Use Rope DEX 0 +0" [ref=e528]:
                - cell "Use Rope" [ref=e529]
                - cell "DEX" [ref=e530]
                - cell [ref=e531]
                - cell [ref=e532]
                - cell "0" [ref=e533]:
                  - spinbutton [ref=e534]: "0"
                - cell "+0" [ref=e535]
          - heading "Background" [level=3] [ref=e536]
          - generic [ref=e537]:
            - generic [ref=e538]: Description
            - textbox "Description" [ref=e539]
          - generic [ref=e540]:
            - generic [ref=e541]: Backstory
            - textbox "Backstory" [ref=e542]
          - generic [ref=e543]:
            - button "Save Character" [disabled] [ref=e544]
            - button "Cancel" [ref=e545] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import { mockAuth, gotoApp } from './fixtures';
  3   | 
  4   | /** Navigates to the app and opens the New Character editor. */
  5   | async function openEditor(page: Page) {
  6   |   await gotoApp(page, []);
  7   |   await page.getByRole('button', { name: '+ Character' }).click();
  8   |   await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
  9   | }
  10  | 
  11  | /** Selects a class in the class dropdown. */
  12  | async function selectClass(page: Page, className: string) {
  13  |   await page.locator('select').filter({ hasText: '— Select class —' }).selectOption(className);
  14  | }
  15  | 
  16  | test.describe('Character Editor', () => {
  17  |   test.describe('Layout', () => {
  18  |     test('shows the New Character heading', async ({ page }) => {
  19  |       await openEditor(page);
  20  | 
  21  |       await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
  22  |     });
  23  | 
  24  |     test('shows the Identity section with a Name field', async ({ page }) => {
  25  |       await openEditor(page);
  26  | 
  27  |       await expect(page.getByRole('heading', { name: /identity/i, level: 3 })).toBeVisible();
  28  |       await expect(page.getByPlaceholder('Character name')).toBeVisible();
  29  |     });
  30  | 
  31  |     test('shows the Class & Level section', async ({ page }) => {
  32  |       await openEditor(page);
  33  | 
  34  |       await expect(page.getByRole('heading', { name: /class/i, level: 3 })).toBeVisible();
  35  |     });
  36  | 
  37  |     test('shows Ability Score rows (STR, DEX, CON, INT, WIS, CHA)', async ({ page }) => {
  38  |       await openEditor(page);
  39  | 
  40  |       await expect(page.getByRole('heading', { name: /ability scores/i, level: 3 })).toBeVisible();
  41  |       for (const label of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) {
> 42  |         await expect(page.getByText(label, { exact: true })).toBeVisible();
      |                                                              ^ Error: expect(locator).toBeVisible() failed
  43  |       }
  44  |     });
  45  | 
  46  |     test('shows the Skills section with a table', async ({ page }) => {
  47  |       await openEditor(page);
  48  | 
  49  |       await expect(page.getByRole('heading', { name: /skills/i, level: 3 })).toBeVisible();
  50  |       await expect(page.getByRole('columnheader', { name: 'Skill' })).toBeVisible();
  51  |       await expect(page.getByRole('columnheader', { name: 'Ranks' })).toBeVisible();
  52  |       await expect(page.getByRole('columnheader', { name: 'Bonus' })).toBeVisible();
  53  |     });
  54  | 
  55  |     test('shows both Cancel buttons (top and bottom of form)', async ({ page }) => {
  56  |       await openEditor(page);
  57  | 
  58  |       await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(2);
  59  |     });
  60  |   });
  61  | 
  62  |   test.describe('Navigation', () => {
  63  |     test('top Cancel button returns to the character list', async ({ page }) => {
  64  |       await openEditor(page);
  65  | 
  66  |       await page.getByRole('button', { name: 'Cancel' }).first().click();
  67  |       await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();
  68  |     });
  69  | 
  70  |     test('bottom Cancel button returns to the character list', async ({ page }) => {
  71  |       await openEditor(page);
  72  | 
  73  |       await page.getByRole('button', { name: 'Cancel' }).last().click();
  74  |       await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();
  75  |     });
  76  |   });
  77  | 
  78  |   test.describe('Form Validation', () => {
  79  |     test('Save Character is disabled when name and class are empty', async ({ page }) => {
  80  |       await openEditor(page);
  81  | 
  82  |       await expect(page.getByRole('button', { name: 'Save Character' })).toBeDisabled();
  83  |     });
  84  | 
  85  |     test('Save Character is disabled when name is filled but no class selected', async ({ page }) => {
  86  |       await openEditor(page);
  87  | 
  88  |       await page.getByPlaceholder('Character name').fill('Thorin');
  89  |       await expect(page.getByRole('button', { name: 'Save Character' })).toBeDisabled();
  90  |     });
  91  | 
  92  |     test('Save Character is disabled when class is selected but name is empty', async ({ page }) => {
  93  |       await openEditor(page);
  94  | 
  95  |       await selectClass(page, 'Rogue');
  96  |       await expect(page.getByRole('button', { name: 'Save Character' })).toBeDisabled();
  97  |     });
  98  | 
  99  |     test('Save Character becomes enabled when both name and class are filled', async ({ page }) => {
  100 |       await openEditor(page);
  101 | 
  102 |       await page.getByPlaceholder('Character name').fill('Thorin');
  103 |       await selectClass(page, 'Fighter');
  104 |       await expect(page.getByRole('button', { name: 'Save Character' })).toBeEnabled();
  105 |     });
  106 |   });
  107 | 
  108 |   test.describe('Form Submission', () => {
  109 |     test('submitting a valid form POSTs to /api/characters and navigates back', async ({ page }) => {
  110 |       let postedBody: Record<string, unknown> | null = null;
  111 | 
  112 |       await mockAuth(page);
  113 |       await page.route('**/api/characters', async (route) => {
  114 |         if (route.request().method() === 'POST') {
  115 |           postedBody = await route.request().postDataJSON() as Record<string, unknown>;
  116 |           await route.fulfill({
  117 |             status: 201,
  118 |             contentType: 'application/json',
  119 |             body: JSON.stringify({ _id: 'new-id', name: 'Thorin', classes: [{ name: 'Fighter', level: 1 }], updatedAt: new Date().toISOString() }),
  120 |           });
  121 |         } else {
  122 |           await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  123 |         }
  124 |       });
  125 | 
  126 |       await page.goto('/');
  127 |       await page.getByRole('button', { name: '+ Character' }).click();
  128 |       await page.getByPlaceholder('Character name').fill('Thorin');
  129 |       await selectClass(page, 'Fighter');
  130 |       await page.getByRole('button', { name: 'Save Character' }).click();
  131 | 
  132 |       await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();
  133 |       expect(postedBody).toMatchObject({ name: 'Thorin' });
  134 |     });
  135 | 
  136 |     test('submitted body contains the selected class', async ({ page }) => {
  137 |       let postedBody: Record<string, unknown> | null = null;
  138 | 
  139 |       await mockAuth(page);
  140 |       await page.route('**/api/characters', async (route) => {
  141 |         if (route.request().method() === 'POST') {
  142 |           postedBody = await route.request().postDataJSON() as Record<string, unknown>;
```