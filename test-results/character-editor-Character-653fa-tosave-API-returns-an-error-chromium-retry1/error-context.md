# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: character-editor.spec.ts >> Character Editor >> Form Submission >> displays an error message when the autosave API returns an error
- Location: e2e/character-editor.spec.ts:288:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'New Character', level: 2 })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'New Character', level: 2 })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic "Application home" [ref=e6]:
        - img [ref=e7]
        - generic [ref=e9]: AD&D (3.5e) Tools
      - navigation [ref=e10]:
        - button "Character Editor" [ref=e12] [cursor=pointer]:
          - text: Character Editor
          - img [ref=e13]
        - button "Tools" [ref=e16] [cursor=pointer]:
          - text: Tools
          - img [ref=e17]
        - button "Campaigns" [ref=e20] [cursor=pointer]:
          - text: Campaigns
          - img [ref=e21]
      - button "▾" [ref=e24] [cursor=pointer]:
        - generic [ref=e25]: T
        - generic [ref=e26]: ▾
  - main [ref=e27]:
    - generic [ref=e29]:
      - generic [ref=e30]:
        - button "Back to characters" [ref=e31] [cursor=pointer]:
          - img [ref=e32]
        - img [ref=e35]
        - heading "Oops" [level=2] [ref=e39]
        - button "Open stat block" [ref=e41] [cursor=pointer]:
          - img [ref=e42]
          - generic [ref=e47]: Stat Block
      - generic [ref=e49]:
        - generic [ref=e50]:
          - heading "Identity" [level=3] [ref=e51]:
            - button "Identity" [expanded] [ref=e52] [cursor=pointer]:
              - img [ref=e53]
              - generic [ref=e55]: Identity
          - generic [ref=e56]:
            - generic [ref=e57]:
              - generic [ref=e58]:
                - generic [ref=e59]: Name*
                - textbox "Name*" [active] [ref=e60]:
                  - /placeholder: Character name
                  - text: Oops
              - generic [ref=e61]:
                - generic [ref=e62]: Gender
                - combobox "Gender" [ref=e63]:
                  - option "Male" [selected]
                  - option "Female"
                  - option "Gender Neutral"
              - generic [ref=e64]:
                - generic [ref=e65]: Race
                - combobox "Race" [ref=e66]:
                  - option "Human" [selected]
                  - option "Elf"
                  - option "Dwarf"
                  - option "Gnome"
                  - option "Halfling"
                  - option "Half-Elf"
                  - option "Half-Orc"
              - generic [ref=e67]:
                - generic [ref=e68]: Alignment
                - combobox "Alignment" [ref=e69]:
                  - option "Lawful Good"
                  - option "Neutral Good"
                  - option "Chaotic Good"
                  - option "Lawful Neutral"
                  - option "True Neutral" [selected]
                  - option "Chaotic Neutral"
                  - option "Lawful Evil"
                  - option "Neutral Evil"
                  - option "Chaotic Evil"
              - generic [ref=e71]:
                - generic [ref=e72]:
                  - generic [ref=e73]: Size
                  - textbox "Size" [ref=e74]: Medium
                - generic [ref=e75]:
                  - generic [ref=e76]: Speed (ft)
                  - textbox "Speed (ft)" [ref=e77]:
                    - /placeholder: "30"
                    - text: "30"
              - generic [ref=e78]:
                - generic [ref=e79]: Deity
                - textbox "Deity" [ref=e80]
              - generic [ref=e81]:
                - generic [ref=e82]: Age
                - textbox "Age" [ref=e83]:
                  - /placeholder: e.g. 25
              - generic [ref=e84]:
                - generic [ref=e85]: Height
                - textbox "Height" [ref=e86]:
                  - /placeholder: e.g. 5'10"
              - generic [ref=e87]:
                - generic [ref=e88]: Weight
                - textbox "Weight" [ref=e89]:
                  - /placeholder: e.g. 180 lbs
              - generic [ref=e90]:
                - generic [ref=e91]: Eyes
                - textbox "Eyes" [ref=e92]
              - generic [ref=e93]:
                - generic [ref=e94]: Hair
                - textbox "Hair" [ref=e95]
              - generic [ref=e96]:
                - generic [ref=e97]: Skin
                - textbox "Skin" [ref=e98]
            - generic [ref=e99]:
              - generic [ref=e100]: Languages (comma-separated)
              - textbox "Languages (comma-separated)" [ref=e101]:
                - /placeholder: Common, Elvish...
        - generic [ref=e102]:
          - heading "Class & Level *" [level=3] [ref=e103]:
            - button "Class & Level *" [expanded] [ref=e104] [cursor=pointer]:
              - img [ref=e105]
              - generic [ref=e107]: Class & Level *
          - generic [ref=e108]:
            - generic [ref=e110]:
              - combobox "Class" [ref=e111]:
                - option "— Select class —"
                - option "Barbarian"
                - option "Bard"
                - option "Cleric" [selected]
                - option "Druid"
                - option "Fighter"
                - option "Monk"
                - option "Paladin"
                - option "Ranger"
                - option "Rogue"
                - option "Sorcerer"
                - option "Wizard"
              - generic [ref=e112]: Level 1 · d8 hit die
            - generic [ref=e114]:
              - generic [ref=e115]: Hit Points
              - textbox "Hit Points" [ref=e116]: "7"
        - generic [ref=e117]:
          - heading "Ability Scores" [level=3] [ref=e118]:
            - button "Ability Scores" [expanded] [ref=e119] [cursor=pointer]:
              - img [ref=e120]
              - generic [ref=e122]: Ability Scores
          - generic [ref=e123]:
            - paragraph [ref=e124]: 0 / 28 points spent · 28 remaining
            - generic [ref=e126]:
              - generic [ref=e127]:
                - generic [ref=e128]: STR
                - generic [ref=e129]:
                  - generic [ref=e130]: base
                  - spinbutton "STR base score" [ref=e131]: "8"
                - generic [ref=e132]:
                  - generic [ref=e133]: racial
                  - generic [ref=e134]: "0"
                - generic [ref=e135]:
                  - generic [ref=e136]: total
                  - generic [ref=e137]: "8"
                - generic [ref=e138]:
                  - generic [ref=e139]: mod
                  - generic [ref=e140]: "-1"
                - generic [ref=e141]:
                  - generic [ref=e142]:
                    - generic [ref=e143]: temp
                    - spinbutton "STR temporary score" [ref=e144]
                  - generic [ref=e145]:
                    - generic [ref=e146]: temp mod
                    - generic [ref=e147]: "-1"
              - generic [ref=e148]:
                - generic [ref=e149]: DEX
                - generic [ref=e150]:
                  - generic [ref=e151]: base
                  - spinbutton "DEX base score" [ref=e152]: "8"
                - generic [ref=e153]:
                  - generic [ref=e154]: racial
                  - generic [ref=e155]: "0"
                - generic [ref=e156]:
                  - generic [ref=e157]: total
                  - generic [ref=e158]: "8"
                - generic [ref=e159]:
                  - generic [ref=e160]: mod
                  - generic [ref=e161]: "-1"
                - generic [ref=e162]:
                  - generic [ref=e163]:
                    - generic [ref=e164]: temp
                    - spinbutton "DEX temporary score" [ref=e165]
                  - generic [ref=e166]:
                    - generic [ref=e167]: temp mod
                    - generic [ref=e168]: "-1"
              - generic [ref=e169]:
                - generic [ref=e170]: CON
                - generic [ref=e171]:
                  - generic [ref=e172]: base
                  - spinbutton "CON base score" [ref=e173]: "8"
                - generic [ref=e174]:
                  - generic [ref=e175]: racial
                  - generic [ref=e176]: "0"
                - generic [ref=e177]:
                  - generic [ref=e178]: total
                  - generic [ref=e179]: "8"
                - generic [ref=e180]:
                  - generic [ref=e181]: mod
                  - generic [ref=e182]: "-1"
                - generic [ref=e183]:
                  - generic [ref=e184]:
                    - generic [ref=e185]: temp
                    - spinbutton "CON temporary score" [ref=e186]
                  - generic [ref=e187]:
                    - generic [ref=e188]: temp mod
                    - generic [ref=e189]: "-1"
              - generic [ref=e190]:
                - generic [ref=e191]: INT
                - generic [ref=e192]:
                  - generic [ref=e193]: base
                  - spinbutton "INT base score" [ref=e194]: "8"
                - generic [ref=e195]:
                  - generic [ref=e196]: racial
                  - generic [ref=e197]: "0"
                - generic [ref=e198]:
                  - generic [ref=e199]: total
                  - generic [ref=e200]: "8"
                - generic [ref=e201]:
                  - generic [ref=e202]: mod
                  - generic [ref=e203]: "-1"
                - generic [ref=e204]:
                  - generic [ref=e205]:
                    - generic [ref=e206]: temp
                    - spinbutton "INT temporary score" [ref=e207]
                  - generic [ref=e208]:
                    - generic [ref=e209]: temp mod
                    - generic [ref=e210]: "-1"
              - generic [ref=e211]:
                - generic [ref=e212]: WIS
                - generic [ref=e213]:
                  - generic [ref=e214]: base
                  - spinbutton "WIS base score" [ref=e215]: "8"
                - generic [ref=e216]:
                  - generic [ref=e217]: racial
                  - generic [ref=e218]: "0"
                - generic [ref=e219]:
                  - generic [ref=e220]: total
                  - generic [ref=e221]: "8"
                - generic [ref=e222]:
                  - generic [ref=e223]: mod
                  - generic [ref=e224]: "-1"
                - generic [ref=e225]:
                  - generic [ref=e226]:
                    - generic [ref=e227]: temp
                    - spinbutton "WIS temporary score" [ref=e228]
                  - generic [ref=e229]:
                    - generic [ref=e230]: temp mod
                    - generic [ref=e231]: "-1"
              - generic [ref=e232]:
                - generic [ref=e233]: CHA
                - generic [ref=e234]:
                  - generic [ref=e235]: base
                  - spinbutton "CHA base score" [ref=e236]: "8"
                - generic [ref=e237]:
                  - generic [ref=e238]: racial
                  - generic [ref=e239]: "0"
                - generic [ref=e240]:
                  - generic [ref=e241]: total
                  - generic [ref=e242]: "8"
                - generic [ref=e243]:
                  - generic [ref=e244]: mod
                  - generic [ref=e245]: "-1"
                - generic [ref=e246]:
                  - generic [ref=e247]:
                    - generic [ref=e248]: temp
                    - spinbutton "CHA temporary score" [ref=e249]
                  - generic [ref=e250]:
                    - generic [ref=e251]: temp mod
                    - generic [ref=e252]: "-1"
        - heading "Feats 6 features · 2 slots" [level=3] [ref=e254]:
          - button "Feats 6 features · 2 slots" [ref=e255] [cursor=pointer]:
            - img [ref=e256]
            - generic [ref=e258]: Feats
            - generic [ref=e259]: 6 features · 2 slots
        - heading "Combat AC 9 · Init -1 · F/R/W +1/-1/+1" [level=3] [ref=e261]:
          - button "Combat AC 9 · Init -1 · F/R/W +1/-1/+1" [ref=e262] [cursor=pointer]:
            - img [ref=e263]
            - generic [ref=e265]: Combat
            - generic [ref=e266]: AC 9 · Init -1 · F/R/W +1/-1/+1
        - heading "Inventory No items equipped" [level=3] [ref=e268]:
          - button "Inventory No items equipped" [ref=e269] [cursor=pointer]:
            - img [ref=e270]
            - generic [ref=e272]: Inventory
            - generic [ref=e273]: No items equipped
        - generic [ref=e274]:
          - heading "Skills" [level=3] [ref=e275]:
            - button "Skills" [expanded] [ref=e276] [cursor=pointer]:
              - img [ref=e277]
              - generic [ref=e279]: Skills
          - generic [ref=e281]:
            - generic [ref=e282]:
              - generic [ref=e283]: "0 / 8 points spent · 8 remaining · max ranks: class 4, cross-class 2"
              - button "Reset all ranks to 0" [ref=e284] [cursor=pointer]:
                - img [ref=e285]
            - table "Skills" [ref=e288]:
              - rowgroup [ref=e289]:
                - row "Trained only Skill Key Ability Class Score Bonus Ranks Misc Bonus" [ref=e290]:
                  - columnheader "Trained only" [ref=e291]
                  - columnheader "Skill" [ref=e292]
                  - columnheader "Key Ability" [ref=e293]
                  - columnheader "Class" [ref=e294]
                  - columnheader "Score" [ref=e295]
                  - columnheader "Bonus" [ref=e296]
                  - columnheader "Ranks" [ref=e297]
                  - columnheader "Misc Bonus" [ref=e298]
              - rowgroup [ref=e299]:
                - row "Appraise INT Appraise is class skill -1 -1 0 0" [ref=e300]:
                  - cell [ref=e301]
                  - cell "Appraise" [ref=e302]
                  - cell "INT" [ref=e303]
                  - cell "Appraise is class skill" [ref=e304]:
                    - checkbox "Appraise is class skill" [ref=e305]
                  - cell "-1" [ref=e306]
                  - cell "-1" [ref=e307]
                  - cell "0" [ref=e308]:
                    - spinbutton "Appraise ranks" [ref=e309]: "0"
                  - cell "0" [ref=e310]:
                    - spinbutton "Appraise misc bonus" [ref=e311]: "0"
                - row "Balance DEX Balance is class skill -1 -1 0 0" [ref=e312]:
                  - cell [ref=e313]
                  - cell "Balance" [ref=e314]
                  - cell "DEX" [ref=e315]
                  - cell "Balance is class skill" [ref=e316]:
                    - checkbox "Balance is class skill" [ref=e317]
                  - cell "-1" [ref=e318]
                  - cell "-1" [ref=e319]
                  - cell "0" [ref=e320]:
                    - spinbutton "Balance ranks" [ref=e321]: "0"
                  - cell "0" [ref=e322]:
                    - spinbutton "Balance misc bonus" [ref=e323]: "0"
                - row "Bluff CHA Bluff is class skill -1 -1 0 0" [ref=e324]:
                  - cell [ref=e325]
                  - cell "Bluff" [ref=e326]
                  - cell "CHA" [ref=e327]
                  - cell "Bluff is class skill" [ref=e328]:
                    - checkbox "Bluff is class skill" [ref=e329]
                  - cell "-1" [ref=e330]
                  - cell "-1" [ref=e331]
                  - cell "0" [ref=e332]:
                    - spinbutton "Bluff ranks" [ref=e333]: "0"
                  - cell "0" [ref=e334]:
                    - spinbutton "Bluff misc bonus" [ref=e335]: "0"
                - row "Climb STR Climb is class skill -1 -1 0 0" [ref=e336]:
                  - cell [ref=e337]
                  - cell "Climb" [ref=e338]
                  - cell "STR" [ref=e339]
                  - cell "Climb is class skill" [ref=e340]:
                    - checkbox "Climb is class skill" [ref=e341]
                  - cell "-1" [ref=e342]
                  - cell "-1" [ref=e343]
                  - cell "0" [ref=e344]:
                    - spinbutton "Climb ranks" [ref=e345]: "0"
                  - cell "0" [ref=e346]:
                    - spinbutton "Climb misc bonus" [ref=e347]: "0"
                - row "Concentration CON Concentration is class skill -1 -1 0 0" [ref=e348]:
                  - cell [ref=e349]
                  - cell "Concentration" [ref=e350]
                  - cell "CON" [ref=e351]
                  - cell "Concentration is class skill" [ref=e352]:
                    - checkbox "Concentration is class skill" [checked] [ref=e353]
                  - cell "-1" [ref=e354]
                  - cell "-1" [ref=e355]
                  - cell "0" [ref=e356]:
                    - spinbutton "Concentration ranks" [ref=e357]: "0"
                  - cell "0" [ref=e358]:
                    - spinbutton "Concentration misc bonus" [ref=e359]: "0"
                - row "Craft INT Craft is class skill -1 -1 0 0" [ref=e360]:
                  - cell [ref=e361]
                  - cell "Craft" [ref=e362]
                  - cell "INT" [ref=e363]
                  - cell "Craft is class skill" [ref=e364]:
                    - checkbox "Craft is class skill" [checked] [ref=e365]
                  - cell "-1" [ref=e366]
                  - cell "-1" [ref=e367]
                  - cell "0" [ref=e368]:
                    - spinbutton "Craft ranks" [ref=e369]: "0"
                  - cell "0" [ref=e370]:
                    - spinbutton "Craft misc bonus" [ref=e371]: "0"
                - row "T Decipher Script INT Decipher Script is class skill -1 -1 0 0" [ref=e372]:
                  - cell "T" [ref=e373]
                  - cell "Decipher Script" [ref=e374]
                  - cell "INT" [ref=e375]
                  - cell "Decipher Script is class skill" [ref=e376]:
                    - checkbox "Decipher Script is class skill" [ref=e377]
                  - cell "-1" [ref=e378]
                  - cell "-1" [ref=e379]
                  - cell "0" [ref=e380]:
                    - spinbutton "Decipher Script ranks" [ref=e381]: "0"
                  - cell "0" [ref=e382]:
                    - spinbutton "Decipher Script misc bonus" [ref=e383]: "0"
                - row "Diplomacy CHA Diplomacy is class skill -1 -1 0 0" [ref=e384]:
                  - cell [ref=e385]
                  - cell "Diplomacy" [ref=e386]
                  - cell "CHA" [ref=e387]
                  - cell "Diplomacy is class skill" [ref=e388]:
                    - checkbox "Diplomacy is class skill" [checked] [ref=e389]
                  - cell "-1" [ref=e390]
                  - cell "-1" [ref=e391]
                  - cell "0" [ref=e392]:
                    - spinbutton "Diplomacy ranks" [ref=e393]: "0"
                  - cell "0" [ref=e394]:
                    - spinbutton "Diplomacy misc bonus" [ref=e395]: "0"
                - row "T Disable Device INT Disable Device is class skill -1 -1 0 0" [ref=e396]:
                  - cell "T" [ref=e397]
                  - cell "Disable Device" [ref=e398]
                  - cell "INT" [ref=e399]
                  - cell "Disable Device is class skill" [ref=e400]:
                    - checkbox "Disable Device is class skill" [ref=e401]
                  - cell "-1" [ref=e402]
                  - cell "-1" [ref=e403]
                  - cell "0" [ref=e404]:
                    - spinbutton "Disable Device ranks" [ref=e405]: "0"
                  - cell "0" [ref=e406]:
                    - spinbutton "Disable Device misc bonus" [ref=e407]: "0"
                - row "Disguise CHA Disguise is class skill -1 -1 0 0" [ref=e408]:
                  - cell [ref=e409]
                  - cell "Disguise" [ref=e410]
                  - cell "CHA" [ref=e411]
                  - cell "Disguise is class skill" [ref=e412]:
                    - checkbox "Disguise is class skill" [ref=e413]
                  - cell "-1" [ref=e414]
                  - cell "-1" [ref=e415]
                  - cell "0" [ref=e416]:
                    - spinbutton "Disguise ranks" [ref=e417]: "0"
                  - cell "0" [ref=e418]:
                    - spinbutton "Disguise misc bonus" [ref=e419]: "0"
                - row "Escape Artist DEX Escape Artist is class skill -1 -1 0 0" [ref=e420]:
                  - cell [ref=e421]
                  - cell "Escape Artist" [ref=e422]
                  - cell "DEX" [ref=e423]
                  - cell "Escape Artist is class skill" [ref=e424]:
                    - checkbox "Escape Artist is class skill" [ref=e425]
                  - cell "-1" [ref=e426]
                  - cell "-1" [ref=e427]
                  - cell "0" [ref=e428]:
                    - spinbutton "Escape Artist ranks" [ref=e429]: "0"
                  - cell "0" [ref=e430]:
                    - spinbutton "Escape Artist misc bonus" [ref=e431]: "0"
                - row "Forgery INT Forgery is class skill -1 -1 0 0" [ref=e432]:
                  - cell [ref=e433]
                  - cell "Forgery" [ref=e434]
                  - cell "INT" [ref=e435]
                  - cell "Forgery is class skill" [ref=e436]:
                    - checkbox "Forgery is class skill" [ref=e437]
                  - cell "-1" [ref=e438]
                  - cell "-1" [ref=e439]
                  - cell "0" [ref=e440]:
                    - spinbutton "Forgery ranks" [ref=e441]: "0"
                  - cell "0" [ref=e442]:
                    - spinbutton "Forgery misc bonus" [ref=e443]: "0"
                - row "Gather Information CHA Gather Information is class skill -1 -1 0 0" [ref=e444]:
                  - cell [ref=e445]
                  - cell "Gather Information" [ref=e446]
                  - cell "CHA" [ref=e447]
                  - cell "Gather Information is class skill" [ref=e448]:
                    - checkbox "Gather Information is class skill" [ref=e449]
                  - cell "-1" [ref=e450]
                  - cell "-1" [ref=e451]
                  - cell "0" [ref=e452]:
                    - spinbutton "Gather Information ranks" [ref=e453]: "0"
                  - cell "0" [ref=e454]:
                    - spinbutton "Gather Information misc bonus" [ref=e455]: "0"
                - row "T Handle Animal CHA Handle Animal is class skill -1 -1 0 0" [ref=e456]:
                  - cell "T" [ref=e457]
                  - cell "Handle Animal" [ref=e458]
                  - cell "CHA" [ref=e459]
                  - cell "Handle Animal is class skill" [ref=e460]:
                    - checkbox "Handle Animal is class skill" [ref=e461]
                  - cell "-1" [ref=e462]
                  - cell "-1" [ref=e463]
                  - cell "0" [ref=e464]:
                    - spinbutton "Handle Animal ranks" [ref=e465]: "0"
                  - cell "0" [ref=e466]:
                    - spinbutton "Handle Animal misc bonus" [ref=e467]: "0"
                - row "Heal WIS Heal is class skill -1 -1 0 0" [ref=e468]:
                  - cell [ref=e469]
                  - cell "Heal" [ref=e470]
                  - cell "WIS" [ref=e471]
                  - cell "Heal is class skill" [ref=e472]:
                    - checkbox "Heal is class skill" [checked] [ref=e473]
                  - cell "-1" [ref=e474]
                  - cell "-1" [ref=e475]
                  - cell "0" [ref=e476]:
                    - spinbutton "Heal ranks" [ref=e477]: "0"
                  - cell "0" [ref=e478]:
                    - spinbutton "Heal misc bonus" [ref=e479]: "0"
                - row "Hide DEX Hide is class skill -1 -1 0 0" [ref=e480]:
                  - cell [ref=e481]
                  - cell "Hide" [ref=e482]
                  - cell "DEX" [ref=e483]
                  - cell "Hide is class skill" [ref=e484]:
                    - checkbox "Hide is class skill" [ref=e485]
                  - cell "-1" [ref=e486]
                  - cell "-1" [ref=e487]
                  - cell "0" [ref=e488]:
                    - spinbutton "Hide ranks" [ref=e489]: "0"
                  - cell "0" [ref=e490]:
                    - spinbutton "Hide misc bonus" [ref=e491]: "0"
                - row "Intimidate CHA Intimidate is class skill -1 -1 0 0" [ref=e492]:
                  - cell [ref=e493]
                  - cell "Intimidate" [ref=e494]
                  - cell "CHA" [ref=e495]
                  - cell "Intimidate is class skill" [ref=e496]:
                    - checkbox "Intimidate is class skill" [ref=e497]
                  - cell "-1" [ref=e498]
                  - cell "-1" [ref=e499]
                  - cell "0" [ref=e500]:
                    - spinbutton "Intimidate ranks" [ref=e501]: "0"
                  - cell "0" [ref=e502]:
                    - spinbutton "Intimidate misc bonus" [ref=e503]: "0"
                - row "Jump STR Jump is class skill -1 -1 0 0" [ref=e504]:
                  - cell [ref=e505]
                  - cell "Jump" [ref=e506]
                  - cell "STR" [ref=e507]
                  - cell "Jump is class skill" [ref=e508]:
                    - checkbox "Jump is class skill" [ref=e509]
                  - cell "-1" [ref=e510]
                  - cell "-1" [ref=e511]
                  - cell "0" [ref=e512]:
                    - spinbutton "Jump ranks" [ref=e513]: "0"
                  - cell "0" [ref=e514]:
                    - spinbutton "Jump misc bonus" [ref=e515]: "0"
                - row "T Knowledge (arcana) INT Knowledge (arcana) is class skill -1 -1 0 0" [ref=e516]:
                  - cell "T" [ref=e517]
                  - cell "Knowledge (arcana)" [ref=e518]
                  - cell "INT" [ref=e519]
                  - cell "Knowledge (arcana) is class skill" [ref=e520]:
                    - checkbox "Knowledge (arcana) is class skill" [checked] [ref=e521]
                  - cell "-1" [ref=e522]
                  - cell "-1" [ref=e523]
                  - cell "0" [ref=e524]:
                    - spinbutton "Knowledge (arcana) ranks" [ref=e525]: "0"
                  - cell "0" [ref=e526]:
                    - spinbutton "Knowledge (arcana) misc bonus" [ref=e527]: "0"
                - row "T Knowledge (architecture & engineering) INT Knowledge (architecture & engineering) is class skill -1 -1 0 0" [ref=e528]:
                  - cell "T" [ref=e529]
                  - cell "Knowledge (architecture & engineering)" [ref=e530]
                  - cell "INT" [ref=e531]
                  - cell "Knowledge (architecture & engineering) is class skill" [ref=e532]:
                    - checkbox "Knowledge (architecture & engineering) is class skill" [ref=e533]
                  - cell "-1" [ref=e534]
                  - cell "-1" [ref=e535]
                  - cell "0" [ref=e536]:
                    - spinbutton "Knowledge (architecture & engineering) ranks" [ref=e537]: "0"
                  - cell "0" [ref=e538]:
                    - spinbutton "Knowledge (architecture & engineering) misc bonus" [ref=e539]: "0"
                - row "T Knowledge (dungeoneering) INT Knowledge (dungeoneering) is class skill -1 -1 0 0" [ref=e540]:
                  - cell "T" [ref=e541]
                  - cell "Knowledge (dungeoneering)" [ref=e542]
                  - cell "INT" [ref=e543]
                  - cell "Knowledge (dungeoneering) is class skill" [ref=e544]:
                    - checkbox "Knowledge (dungeoneering) is class skill" [ref=e545]
                  - cell "-1" [ref=e546]
                  - cell "-1" [ref=e547]
                  - cell "0" [ref=e548]:
                    - spinbutton "Knowledge (dungeoneering) ranks" [ref=e549]: "0"
                  - cell "0" [ref=e550]:
                    - spinbutton "Knowledge (dungeoneering) misc bonus" [ref=e551]: "0"
                - row "T Knowledge (geography) INT Knowledge (geography) is class skill -1 -1 0 0" [ref=e552]:
                  - cell "T" [ref=e553]
                  - cell "Knowledge (geography)" [ref=e554]
                  - cell "INT" [ref=e555]
                  - cell "Knowledge (geography) is class skill" [ref=e556]:
                    - checkbox "Knowledge (geography) is class skill" [ref=e557]
                  - cell "-1" [ref=e558]
                  - cell "-1" [ref=e559]
                  - cell "0" [ref=e560]:
                    - spinbutton "Knowledge (geography) ranks" [ref=e561]: "0"
                  - cell "0" [ref=e562]:
                    - spinbutton "Knowledge (geography) misc bonus" [ref=e563]: "0"
                - row "T Knowledge (history) INT Knowledge (history) is class skill -1 -1 0 0" [ref=e564]:
                  - cell "T" [ref=e565]
                  - cell "Knowledge (history)" [ref=e566]
                  - cell "INT" [ref=e567]
                  - cell "Knowledge (history) is class skill" [ref=e568]:
                    - checkbox "Knowledge (history) is class skill" [checked] [ref=e569]
                  - cell "-1" [ref=e570]
                  - cell "-1" [ref=e571]
                  - cell "0" [ref=e572]:
                    - spinbutton "Knowledge (history) ranks" [ref=e573]: "0"
                  - cell "0" [ref=e574]:
                    - spinbutton "Knowledge (history) misc bonus" [ref=e575]: "0"
                - row "T Knowledge (local) INT Knowledge (local) is class skill -1 -1 0 0" [ref=e576]:
                  - cell "T" [ref=e577]
                  - cell "Knowledge (local)" [ref=e578]
                  - cell "INT" [ref=e579]
                  - cell "Knowledge (local) is class skill" [ref=e580]:
                    - checkbox "Knowledge (local) is class skill" [ref=e581]
                  - cell "-1" [ref=e582]
                  - cell "-1" [ref=e583]
                  - cell "0" [ref=e584]:
                    - spinbutton "Knowledge (local) ranks" [ref=e585]: "0"
                  - cell "0" [ref=e586]:
                    - spinbutton "Knowledge (local) misc bonus" [ref=e587]: "0"
                - row "T Knowledge (nature) INT Knowledge (nature) is class skill -1 -1 0 0" [ref=e588]:
                  - cell "T" [ref=e589]
                  - cell "Knowledge (nature)" [ref=e590]
                  - cell "INT" [ref=e591]
                  - cell "Knowledge (nature) is class skill" [ref=e592]:
                    - checkbox "Knowledge (nature) is class skill" [ref=e593]
                  - cell "-1" [ref=e594]
                  - cell "-1" [ref=e595]
                  - cell "0" [ref=e596]:
                    - spinbutton "Knowledge (nature) ranks" [ref=e597]: "0"
                  - cell "0" [ref=e598]:
                    - spinbutton "Knowledge (nature) misc bonus" [ref=e599]: "0"
                - row "T Knowledge (nobility & royalty) INT Knowledge (nobility & royalty) is class skill -1 -1 0 0" [ref=e600]:
                  - cell "T" [ref=e601]
                  - cell "Knowledge (nobility & royalty)" [ref=e602]
                  - cell "INT" [ref=e603]
                  - cell "Knowledge (nobility & royalty) is class skill" [ref=e604]:
                    - checkbox "Knowledge (nobility & royalty) is class skill" [ref=e605]
                  - cell "-1" [ref=e606]
                  - cell "-1" [ref=e607]
                  - cell "0" [ref=e608]:
                    - spinbutton "Knowledge (nobility & royalty) ranks" [ref=e609]: "0"
                  - cell "0" [ref=e610]:
                    - spinbutton "Knowledge (nobility & royalty) misc bonus" [ref=e611]: "0"
                - row "T Knowledge (religion) INT Knowledge (religion) is class skill -1 -1 0 0" [ref=e612]:
                  - cell "T" [ref=e613]
                  - cell "Knowledge (religion)" [ref=e614]
                  - cell "INT" [ref=e615]
                  - cell "Knowledge (religion) is class skill" [ref=e616]:
                    - checkbox "Knowledge (religion) is class skill" [checked] [ref=e617]
                  - cell "-1" [ref=e618]
                  - cell "-1" [ref=e619]
                  - cell "0" [ref=e620]:
                    - spinbutton "Knowledge (religion) ranks" [ref=e621]: "0"
                  - cell "0" [ref=e622]:
                    - spinbutton "Knowledge (religion) misc bonus" [ref=e623]: "0"
                - row "T Knowledge (the planes) INT Knowledge (the planes) is class skill -1 -1 0 0" [ref=e624]:
                  - cell "T" [ref=e625]
                  - cell "Knowledge (the planes)" [ref=e626]
                  - cell "INT" [ref=e627]
                  - cell "Knowledge (the planes) is class skill" [ref=e628]:
                    - checkbox "Knowledge (the planes) is class skill" [checked] [ref=e629]
                  - cell "-1" [ref=e630]
                  - cell "-1" [ref=e631]
                  - cell "0" [ref=e632]:
                    - spinbutton "Knowledge (the planes) ranks" [ref=e633]: "0"
                  - cell "0" [ref=e634]:
                    - spinbutton "Knowledge (the planes) misc bonus" [ref=e635]: "0"
                - row "Listen WIS Listen is class skill -1 -1 0 0" [ref=e636]:
                  - cell [ref=e637]
                  - cell "Listen" [ref=e638]
                  - cell "WIS" [ref=e639]
                  - cell "Listen is class skill" [ref=e640]:
                    - checkbox "Listen is class skill" [ref=e641]
                  - cell "-1" [ref=e642]
                  - cell "-1" [ref=e643]
                  - cell "0" [ref=e644]:
                    - spinbutton "Listen ranks" [ref=e645]: "0"
                  - cell "0" [ref=e646]:
                    - spinbutton "Listen misc bonus" [ref=e647]: "0"
                - row "Move Silently DEX Move Silently is class skill -1 -1 0 0" [ref=e648]:
                  - cell [ref=e649]
                  - cell "Move Silently" [ref=e650]
                  - cell "DEX" [ref=e651]
                  - cell "Move Silently is class skill" [ref=e652]:
                    - checkbox "Move Silently is class skill" [ref=e653]
                  - cell "-1" [ref=e654]
                  - cell "-1" [ref=e655]
                  - cell "0" [ref=e656]:
                    - spinbutton "Move Silently ranks" [ref=e657]: "0"
                  - cell "0" [ref=e658]:
                    - spinbutton "Move Silently misc bonus" [ref=e659]: "0"
                - row "T Open Lock DEX Open Lock is class skill -1 -1 0 0" [ref=e660]:
                  - cell "T" [ref=e661]
                  - cell "Open Lock" [ref=e662]
                  - cell "DEX" [ref=e663]
                  - cell "Open Lock is class skill" [ref=e664]:
                    - checkbox "Open Lock is class skill" [ref=e665]
                  - cell "-1" [ref=e666]
                  - cell "-1" [ref=e667]
                  - cell "0" [ref=e668]:
                    - spinbutton "Open Lock ranks" [ref=e669]: "0"
                  - cell "0" [ref=e670]:
                    - spinbutton "Open Lock misc bonus" [ref=e671]: "0"
                - row "Perform CHA Perform is class skill -1 -1 0 0" [ref=e672]:
                  - cell [ref=e673]
                  - cell "Perform" [ref=e674]
                  - cell "CHA" [ref=e675]
                  - cell "Perform is class skill" [ref=e676]:
                    - checkbox "Perform is class skill" [ref=e677]
                  - cell "-1" [ref=e678]
                  - cell "-1" [ref=e679]
                  - cell "0" [ref=e680]:
                    - spinbutton "Perform ranks" [ref=e681]: "0"
                  - cell "0" [ref=e682]:
                    - spinbutton "Perform misc bonus" [ref=e683]: "0"
                - row "T Profession WIS Profession is class skill -1 -1 0 0" [ref=e684]:
                  - cell "T" [ref=e685]
                  - cell "Profession" [ref=e686]
                  - cell "WIS" [ref=e687]
                  - cell "Profession is class skill" [ref=e688]:
                    - checkbox "Profession is class skill" [checked] [ref=e689]
                  - cell "-1" [ref=e690]
                  - cell "-1" [ref=e691]
                  - cell "0" [ref=e692]:
                    - spinbutton "Profession ranks" [ref=e693]: "0"
                  - cell "0" [ref=e694]:
                    - spinbutton "Profession misc bonus" [ref=e695]: "0"
                - row "Ride DEX Ride is class skill -1 -1 0 0" [ref=e696]:
                  - cell [ref=e697]
                  - cell "Ride" [ref=e698]
                  - cell "DEX" [ref=e699]
                  - cell "Ride is class skill" [ref=e700]:
                    - checkbox "Ride is class skill" [ref=e701]
                  - cell "-1" [ref=e702]
                  - cell "-1" [ref=e703]
                  - cell "0" [ref=e704]:
                    - spinbutton "Ride ranks" [ref=e705]: "0"
                  - cell "0" [ref=e706]:
                    - spinbutton "Ride misc bonus" [ref=e707]: "0"
                - row "Search INT Search is class skill -1 -1 0 0" [ref=e708]:
                  - cell [ref=e709]
                  - cell "Search" [ref=e710]
                  - cell "INT" [ref=e711]
                  - cell "Search is class skill" [ref=e712]:
                    - checkbox "Search is class skill" [ref=e713]
                  - cell "-1" [ref=e714]
                  - cell "-1" [ref=e715]
                  - cell "0" [ref=e716]:
                    - spinbutton "Search ranks" [ref=e717]: "0"
                  - cell "0" [ref=e718]:
                    - spinbutton "Search misc bonus" [ref=e719]: "0"
                - row "Sense Motive WIS Sense Motive is class skill -1 -1 0 0" [ref=e720]:
                  - cell [ref=e721]
                  - cell "Sense Motive" [ref=e722]
                  - cell "WIS" [ref=e723]
                  - cell "Sense Motive is class skill" [ref=e724]:
                    - checkbox "Sense Motive is class skill" [ref=e725]
                  - cell "-1" [ref=e726]
                  - cell "-1" [ref=e727]
                  - cell "0" [ref=e728]:
                    - spinbutton "Sense Motive ranks" [ref=e729]: "0"
                  - cell "0" [ref=e730]:
                    - spinbutton "Sense Motive misc bonus" [ref=e731]: "0"
                - row "T Sleight of Hand DEX Sleight of Hand is class skill -1 -1 0 0" [ref=e732]:
                  - cell "T" [ref=e733]
                  - cell "Sleight of Hand" [ref=e734]
                  - cell "DEX" [ref=e735]
                  - cell "Sleight of Hand is class skill" [ref=e736]:
                    - checkbox "Sleight of Hand is class skill" [ref=e737]
                  - cell "-1" [ref=e738]
                  - cell "-1" [ref=e739]
                  - cell "0" [ref=e740]:
                    - spinbutton "Sleight of Hand ranks" [ref=e741]: "0"
                  - cell "0" [ref=e742]:
                    - spinbutton "Sleight of Hand misc bonus" [ref=e743]: "0"
                - row "T Speak Language 0 Speak Language is class skill 0 +0 0 0" [ref=e744]:
                  - cell "T" [ref=e745]
                  - cell "Speak Language" [ref=e746]
                  - cell "0" [ref=e747]
                  - cell "Speak Language is class skill" [ref=e748]:
                    - checkbox "Speak Language is class skill" [ref=e749]
                  - cell "0" [ref=e750]
                  - cell "+0" [ref=e751]
                  - cell "0" [ref=e752]:
                    - spinbutton "Speak Language ranks" [ref=e753]: "0"
                  - cell "0" [ref=e754]:
                    - spinbutton "Speak Language misc bonus" [ref=e755]: "0"
                - row "T Spellcraft INT Spellcraft is class skill -1 -1 0 0" [ref=e756]:
                  - cell "T" [ref=e757]
                  - cell "Spellcraft" [ref=e758]
                  - cell "INT" [ref=e759]
                  - cell "Spellcraft is class skill" [ref=e760]:
                    - checkbox "Spellcraft is class skill" [checked] [ref=e761]
                  - cell "-1" [ref=e762]
                  - cell "-1" [ref=e763]
                  - cell "0" [ref=e764]:
                    - spinbutton "Spellcraft ranks" [ref=e765]: "0"
                  - cell "0" [ref=e766]:
                    - spinbutton "Spellcraft misc bonus" [ref=e767]: "0"
                - row "Spot WIS Spot is class skill -1 -1 0 0" [ref=e768]:
                  - cell [ref=e769]
                  - cell "Spot" [ref=e770]
                  - cell "WIS" [ref=e771]
                  - cell "Spot is class skill" [ref=e772]:
                    - checkbox "Spot is class skill" [ref=e773]
                  - cell "-1" [ref=e774]
                  - cell "-1" [ref=e775]
                  - cell "0" [ref=e776]:
                    - spinbutton "Spot ranks" [ref=e777]: "0"
                  - cell "0" [ref=e778]:
                    - spinbutton "Spot misc bonus" [ref=e779]: "0"
                - row "Survival WIS Survival is class skill -1 -1 0 0" [ref=e780]:
                  - cell [ref=e781]
                  - cell "Survival" [ref=e782]
                  - cell "WIS" [ref=e783]
                  - cell "Survival is class skill" [ref=e784]:
                    - checkbox "Survival is class skill" [ref=e785]
                  - cell "-1" [ref=e786]
                  - cell "-1" [ref=e787]
                  - cell "0" [ref=e788]:
                    - spinbutton "Survival ranks" [ref=e789]: "0"
                  - cell "0" [ref=e790]:
                    - spinbutton "Survival misc bonus" [ref=e791]: "0"
                - row "Swim STR Swim is class skill -1 -1 0 0" [ref=e792]:
                  - cell [ref=e793]
                  - cell "Swim" [ref=e794]
                  - cell "STR" [ref=e795]
                  - cell "Swim is class skill" [ref=e796]:
                    - checkbox "Swim is class skill" [ref=e797]
                  - cell "-1" [ref=e798]
                  - cell "-1" [ref=e799]
                  - cell "0" [ref=e800]:
                    - spinbutton "Swim ranks" [ref=e801]: "0"
                  - cell "0" [ref=e802]:
                    - spinbutton "Swim misc bonus" [ref=e803]: "0"
                - row "T Tumble DEX Tumble is class skill -1 -1 0 0" [ref=e804]:
                  - cell "T" [ref=e805]
                  - cell "Tumble" [ref=e806]
                  - cell "DEX" [ref=e807]
                  - cell "Tumble is class skill" [ref=e808]:
                    - checkbox "Tumble is class skill" [ref=e809]
                  - cell "-1" [ref=e810]
                  - cell "-1" [ref=e811]
                  - cell "0" [ref=e812]:
                    - spinbutton "Tumble ranks" [ref=e813]: "0"
                  - cell "0" [ref=e814]:
                    - spinbutton "Tumble misc bonus" [ref=e815]: "0"
                - row "T Use Magic Device CHA Use Magic Device is class skill -1 -1 0 0" [ref=e816]:
                  - cell "T" [ref=e817]
                  - cell "Use Magic Device" [ref=e818]
                  - cell "CHA" [ref=e819]
                  - cell "Use Magic Device is class skill" [ref=e820]:
                    - checkbox "Use Magic Device is class skill" [ref=e821]
                  - cell "-1" [ref=e822]
                  - cell "-1" [ref=e823]
                  - cell "0" [ref=e824]:
                    - spinbutton "Use Magic Device ranks" [ref=e825]: "0"
                  - cell "0" [ref=e826]:
                    - spinbutton "Use Magic Device misc bonus" [ref=e827]: "0"
                - row "Use Rope DEX Use Rope is class skill -1 -1 0 0" [ref=e828]:
                  - cell [ref=e829]
                  - cell "Use Rope" [ref=e830]
                  - cell "DEX" [ref=e831]
                  - cell "Use Rope is class skill" [ref=e832]:
                    - checkbox "Use Rope is class skill" [ref=e833]
                  - cell "-1" [ref=e834]
                  - cell "-1" [ref=e835]
                  - cell "0" [ref=e836]:
                    - spinbutton "Use Rope ranks" [ref=e837]: "0"
                  - cell "0" [ref=e838]:
                    - spinbutton "Use Rope misc bonus" [ref=e839]: "0"
        - heading "Background" [level=3] [ref=e841]:
          - button "Background" [ref=e842] [cursor=pointer]:
            - img [ref=e843]
            - generic [ref=e845]: Background
        - paragraph [ref=e846]: Name is required
  - complementary [ref=e847]:
    - generic [ref=e848]:
      - heading "Settings" [level=3] [ref=e849]
      - button "Close" [ref=e850] [cursor=pointer]
    - generic [ref=e852]:
      - generic [ref=e853]: Theme
      - switch "Theme toggle" [ref=e854] [cursor=pointer]:
        - generic [ref=e856]:
          - generic [ref=e857]: Light
          - generic [ref=e858]: Dark
    - generic [ref=e860]:
      - heading "Rules" [level=3] [ref=e861]
      - paragraph [ref=e862]: Point Buy System
      - button "28-point" [ref=e864] [cursor=pointer]:
        - generic [ref=e865]: 28-point
        - img [ref=e866]
```

# Test source

```ts
  209 |           postedBody = await route.request().postDataJSON() as Record<string, unknown>;
  210 |           await route.fulfill({
  211 |             status: 201,
  212 |             contentType: 'application/json',
  213 |             body: JSON.stringify({ _id: 'new-id', name: 'Lyra', classes: [{ name: 'Wizard', level: 1 }], updatedAt: new Date().toISOString() }),
  214 |           });
  215 |         } else {
  216 |           await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  217 |         }
  218 |       });
  219 | 
  220 |       await page.goto('/');
  221 |       await page.getByRole('button', { name: '+ New' }).click();
  222 |       await page.getByPlaceholder('Character name').fill('Lyra');
  223 |       await selectClass(page, 'Wizard');
  224 | 
  225 |       await expect(page.getByRole('button', { name: 'Export PDF' })).toBeVisible();
  226 |       expect(postedBody).toMatchObject({
  227 |         classes: [{ name: 'Wizard', level: 1 }],
  228 |       });
  229 |     });
  230 | 
  231 |     test('autosave body contains calculated first-level hit points', async ({ page }) => {
  232 |       let postedBody: Record<string, unknown> | null = null;
  233 | 
  234 |       await mockAuth(page);
  235 |       await page.route('**/api/characters', async (route) => {
  236 |         if (route.request().method() === 'POST') {
  237 |           postedBody = await route.request().postDataJSON() as Record<string, unknown>;
  238 |           await route.fulfill({
  239 |             status: 201,
  240 |             contentType: 'application/json',
  241 |             body: JSON.stringify({ _id: 'new-id', name: 'Borin', classes: [{ name: 'Fighter', level: 1 }], updatedAt: new Date().toISOString() }),
  242 |           });
  243 |         } else {
  244 |           await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  245 |         }
  246 |       });
  247 | 
  248 |       await page.goto('/');
  249 |       await page.getByRole('button', { name: '+ New' }).click();
  250 |       await page.getByPlaceholder('Character name').fill('Borin');
  251 |       await selectClass(page, 'Fighter');
  252 |       await abilityRow(page, 'CON').locator('input[type="number"]').first().fill('14');
  253 | 
  254 |       await expect(page.getByRole('button', { name: 'Export PDF' })).toBeVisible();
  255 |       expect(postedBody).toMatchObject({
  256 |         hitPoints: { max: 12, current: 12, nonlethal: 0 },
  257 |       });
  258 |     });
  259 | 
  260 |     test('shows saving indicator while autosave is in flight', async ({ page }) => {
  261 |       await mockAuth(page);
  262 | 
  263 |       let resolveSave!: () => void;
  264 |       await page.route('**/api/characters', async (route) => {
  265 |         if (route.request().method() === 'POST') {
  266 |           await new Promise<void>((res) => { resolveSave = res; });
  267 |           await route.fulfill({
  268 |             status: 201,
  269 |             contentType: 'application/json',
  270 |             body: JSON.stringify({ _id: 'new-id', name: 'Zara', classes: [{ name: 'Rogue', level: 1 }], updatedAt: new Date().toISOString() }),
  271 |           });
  272 |         } else {
  273 |           await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  274 |         }
  275 |       });
  276 | 
  277 |       await page.goto('/');
  278 |       await page.getByRole('button', { name: '+ New' }).click();
  279 |       await page.getByPlaceholder('Character name').fill('Zara');
  280 |       await selectClass(page, 'Rogue');
  281 | 
  282 |       // While autosave is in flight, saving indicator text appears
  283 |       await expect(page.getByText('Saving...')).toBeVisible();
  284 |       resolveSave();
  285 |       await expect(page.getByText('Saving...')).not.toBeVisible();
  286 |     });
  287 | 
  288 |     test('displays an error message when the autosave API returns an error', async ({ page }) => {
  289 |       await mockAuth(page);
  290 |       await page.route('**/api/characters', async (route) => {
  291 |         if (route.request().method() === 'POST') {
  292 |           await route.fulfill({
  293 |             status: 400,
  294 |             contentType: 'application/json',
  295 |             body: JSON.stringify({ error: 'Name is required' }),
  296 |           });
  297 |         } else {
  298 |           await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  299 |         }
  300 |       });
  301 | 
  302 |       await page.goto('/');
  303 |       await page.getByRole('button', { name: '+ New' }).click();
  304 |       await page.getByPlaceholder('Character name').fill('Oops');
  305 |       await selectClass(page, 'Cleric');
  306 | 
  307 |       await expect(page.getByText('Name is required')).toBeVisible();
  308 |       // Should remain on the editor page
> 309 |       await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
      |                                                                                    ^ Error: expect(locator).toBeVisible() failed
  310 |     });
  311 |   });
  312 | 
  313 |   test.describe('Identity Fields', () => {
  314 |     test('Race dropdown changes racial ability bonuses', async ({ page }) => {
  315 |       await openEditor(page);
  316 | 
  317 |       // Default race is Human — select Elf which has +2 DEX / -2 CON
  318 |       const raceSelect = page.locator('select').filter({ hasText: 'Human' }).first();
  319 |       await raceSelect.selectOption('Elf');
  320 | 
  321 |       // The racial column for DEX should show +2
  322 |       const dexRow = page.locator('div.flex.items-center.gap-3').filter({ hasText: 'DEX' });
  323 |       await expect(dexRow.getByText('+2')).toBeVisible();
  324 |     });
  325 | 
  326 |     test('can fill optional identity fields without errors', async ({ page }) => {
  327 |       await openEditor(page);
  328 | 
  329 |       await page.getByPlaceholder('e.g. 25').fill('30');
  330 |       await page.getByPlaceholder("e.g. 5'10\"").fill("6'2\"");
  331 |       await page.getByPlaceholder('e.g. 180 lbs').fill('190 lbs');
  332 |       await page.getByPlaceholder('Common, Elvish...').fill('Common, Elvish');
  333 | 
  334 |       // No errors should be visible
  335 |       await expect(page.getByText(/failed|error/i)).not.toBeVisible();
  336 |     });
  337 | 
  338 |     test('ability scores cannot go below 8 or exceed the remaining point-buy budget', async ({ page }) => {
  339 |       await openEditor(page);
  340 | 
  341 |       const strengthInput = abilityRow(page, 'STR').locator('input[type="number"]').first();
  342 |       await strengthInput.fill('18');
  343 |       await expect(strengthInput).toHaveValue('18');
  344 |       await expect(page.getByText('16 / 28 points spent · 12 remaining')).toBeVisible();
  345 | 
  346 |       const dexterityInput = abilityRow(page, 'DEX').locator('input[type="number"]').first();
  347 |       await dexterityInput.fill('18');
  348 |       await expect(dexterityInput).toHaveValue('16');
  349 |       await expect(page.getByText('26 / 28 points spent · 2 remaining')).toBeVisible();
  350 | 
  351 |       await strengthInput.fill('6');
  352 |       await expect(strengthInput).toHaveValue('8');
  353 |     });
  354 | 
  355 |     test('hit points update when class or constitution changes', async ({ page }) => {
  356 |       await openEditor(page);
  357 | 
  358 |       const hitPointsInput = page.getByRole('textbox', { name: 'Hit Points' });
  359 |       await selectClass(page, 'Fighter');
  360 |       await expect(hitPointsInput).toHaveValue('9');
  361 | 
  362 |       await abilityRow(page, 'CON').locator('input[type="number"]').first().fill('14');
  363 |       await expect(hitPointsInput).toHaveValue('12');
  364 | 
  365 |       await selectClass(page, 'Wizard');
  366 |       await expect(hitPointsInput).toHaveValue('6');
  367 |     });
  368 |   });
  369 | 
  370 |   test.describe('Backup Weapons', () => {
  371 |     async function openInventory(page: Page) {
  372 |       await page.getByRole('button', { name: /Inventory/i }).click();
  373 |       await expect(page.getByRole('button', { name: 'Add Weapon' })).toBeVisible();
  374 |     }
  375 | 
  376 |     test('can add up to three backup weapon selectors', async ({ page }) => {
  377 |       await openEditor(page);
  378 |       await openInventory(page);
  379 | 
  380 |       const addWeaponButton = page.getByRole('button', { name: 'Add Weapon' });
  381 |       await expect(page.getByText('0/3 backup weapons')).toBeVisible();
  382 | 
  383 |       await addWeaponButton.click();
  384 |       await expect(page.getByText('1/3 backup weapons')).toBeVisible();
  385 | 
  386 |       await addWeaponButton.click();
  387 |       await expect(page.getByText('2/3 backup weapons')).toBeVisible();
  388 | 
  389 |       await addWeaponButton.click();
  390 |       await expect(page.getByText('3/3 backup weapons')).toBeVisible();
  391 | 
  392 |       await expect(page.getByRole('textbox', { name: 'Weapon selector name' })).toHaveCount(3);
  393 |       await expect(addWeaponButton).toBeDisabled();
  394 |     });
  395 | 
  396 |     test('inline backup weapon label is included in autosave payload', async ({ page }) => {
  397 |       let latestSavedBody: Record<string, unknown> | null = null;
  398 | 
  399 |       await mockAuth(page);
  400 |       await page.route('**/api/characters', async (route) => {
  401 |         const method = route.request().method();
  402 |         if (method === 'GET') {
  403 |           await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  404 |           return;
  405 |         }
  406 | 
  407 |         if (method === 'POST' || method === 'PUT') {
  408 |           latestSavedBody = await route.request().postDataJSON() as Record<string, unknown>;
  409 |           await route.fulfill({
```