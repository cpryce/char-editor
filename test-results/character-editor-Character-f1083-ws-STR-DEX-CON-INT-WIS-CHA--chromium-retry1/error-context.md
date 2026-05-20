# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: character-editor.spec.ts >> Character Editor >> Layout >> shows Ability Score rows (STR, DEX, CON, INT, WIS, CHA)
- Location: e2e/character-editor.spec.ts:51:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('span.w-8').filter({ hasText: 'STR' })
Expected: visible
Error: strict mode violation: locator('span.w-8').filter({ hasText: 'STR' }) resolved to 3 elements:
    1) <span class="w-8 text-xs font-semibold ability-fg-default">STR</span> aka getByText('STR').first()
    2) <span class="w-8 text-xs font-semibold ability-fg-default">STR</span> aka getByText('STR').nth(1)
    3) <span class="w-8 text-xs font-semibold ability-fg-default">STR</span> aka getByText('STR').nth(2)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('span.w-8').filter({ hasText: 'STR' })

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
        - heading "New Character" [level=2] [ref=e39]
      - generic [ref=e41]:
        - generic [ref=e42]:
          - heading "Identity" [level=3] [ref=e43]:
            - button "Identity" [expanded] [ref=e44] [cursor=pointer]:
              - img [ref=e45]
              - generic [ref=e47]: Identity
          - generic [ref=e48]:
            - generic [ref=e49]:
              - generic [ref=e50]:
                - generic [ref=e51]: Name*
                - textbox "Name*" [ref=e52]:
                  - /placeholder: Character name
              - generic [ref=e53]:
                - generic [ref=e54]: Gender
                - combobox "Gender" [ref=e55]:
                  - option "Male" [selected]
                  - option "Female"
                  - option "Gender Neutral"
              - generic [ref=e56]:
                - generic [ref=e57]: Race
                - combobox "Race" [ref=e58]:
                  - option "Human" [selected]
                  - option "Elf"
                  - option "Dwarf"
                  - option "Gnome"
                  - option "Halfling"
                  - option "Half-Elf"
                  - option "Half-Orc"
              - generic [ref=e59]:
                - generic [ref=e60]: Alignment
                - combobox "Alignment" [ref=e61]:
                  - option "Lawful Good"
                  - option "Neutral Good"
                  - option "Chaotic Good"
                  - option "Lawful Neutral"
                  - option "True Neutral" [selected]
                  - option "Chaotic Neutral"
                  - option "Lawful Evil"
                  - option "Neutral Evil"
                  - option "Chaotic Evil"
              - generic [ref=e63]:
                - generic [ref=e64]:
                  - generic [ref=e65]: Size
                  - textbox "Size" [ref=e66]: Medium
                - generic [ref=e67]:
                  - generic [ref=e68]: Speed (ft)
                  - textbox "Speed (ft)" [ref=e69]:
                    - /placeholder: "30"
                    - text: "30"
              - generic [ref=e70]:
                - generic [ref=e71]: Deity
                - textbox "Deity" [ref=e72]
              - generic [ref=e73]:
                - generic [ref=e74]: Age
                - textbox "Age" [ref=e75]:
                  - /placeholder: e.g. 25
              - generic [ref=e76]:
                - generic [ref=e77]: Height
                - textbox "Height" [ref=e78]:
                  - /placeholder: e.g. 5'10"
              - generic [ref=e79]:
                - generic [ref=e80]: Weight
                - textbox "Weight" [ref=e81]:
                  - /placeholder: e.g. 180 lbs
              - generic [ref=e82]:
                - generic [ref=e83]: Eyes
                - textbox "Eyes" [ref=e84]
              - generic [ref=e85]:
                - generic [ref=e86]: Hair
                - textbox "Hair" [ref=e87]
              - generic [ref=e88]:
                - generic [ref=e89]: Skin
                - textbox "Skin" [ref=e90]
            - generic [ref=e91]:
              - generic [ref=e92]: Languages (comma-separated)
              - textbox "Languages (comma-separated)" [ref=e93]:
                - /placeholder: Common, Elvish...
        - generic [ref=e94]:
          - heading "Class & Level *" [level=3] [ref=e95]:
            - button "Class & Level *" [expanded] [ref=e96] [cursor=pointer]:
              - img [ref=e97]
              - generic [ref=e99]: Class & Level *
          - generic [ref=e100]:
            - combobox "Class" [ref=e103]:
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
            - generic [ref=e105]:
              - generic [ref=e106]: Hit Points
              - textbox "Hit Points" [ref=e107]: "0"
        - generic [ref=e108]:
          - heading "Ability Scores" [level=3] [ref=e109]:
            - button "Ability Scores" [expanded] [ref=e110] [cursor=pointer]:
              - img [ref=e111]
              - generic [ref=e113]: Ability Scores
          - generic [ref=e114]:
            - paragraph [ref=e115]: 0 / 28 points spent · 28 remaining
            - generic [ref=e117]:
              - generic [ref=e118]:
                - generic [ref=e119]: STR
                - generic [ref=e120]:
                  - generic [ref=e121]: base
                  - spinbutton "STR base score" [ref=e122]: "8"
                - generic [ref=e123]:
                  - generic [ref=e124]: racial
                  - generic [ref=e125]: "0"
                - generic [ref=e126]:
                  - generic [ref=e127]: total
                  - generic [ref=e128]: "8"
                - generic [ref=e129]:
                  - generic [ref=e130]: mod
                  - generic [ref=e131]: "-1"
                - generic [ref=e132]:
                  - generic [ref=e133]:
                    - generic [ref=e134]: temp
                    - spinbutton "STR temporary score" [ref=e135]
                  - generic [ref=e136]:
                    - generic [ref=e137]: temp mod
                    - generic [ref=e138]: "-1"
              - generic [ref=e139]:
                - generic [ref=e140]: DEX
                - generic [ref=e141]:
                  - generic [ref=e142]: base
                  - spinbutton "DEX base score" [ref=e143]: "8"
                - generic [ref=e144]:
                  - generic [ref=e145]: racial
                  - generic [ref=e146]: "0"
                - generic [ref=e147]:
                  - generic [ref=e148]: total
                  - generic [ref=e149]: "8"
                - generic [ref=e150]:
                  - generic [ref=e151]: mod
                  - generic [ref=e152]: "-1"
                - generic [ref=e153]:
                  - generic [ref=e154]:
                    - generic [ref=e155]: temp
                    - spinbutton "DEX temporary score" [ref=e156]
                  - generic [ref=e157]:
                    - generic [ref=e158]: temp mod
                    - generic [ref=e159]: "-1"
              - generic [ref=e160]:
                - generic [ref=e161]: CON
                - generic [ref=e162]:
                  - generic [ref=e163]: base
                  - spinbutton "CON base score" [ref=e164]: "8"
                - generic [ref=e165]:
                  - generic [ref=e166]: racial
                  - generic [ref=e167]: "0"
                - generic [ref=e168]:
                  - generic [ref=e169]: total
                  - generic [ref=e170]: "8"
                - generic [ref=e171]:
                  - generic [ref=e172]: mod
                  - generic [ref=e173]: "-1"
                - generic [ref=e174]:
                  - generic [ref=e175]:
                    - generic [ref=e176]: temp
                    - spinbutton "CON temporary score" [ref=e177]
                  - generic [ref=e178]:
                    - generic [ref=e179]: temp mod
                    - generic [ref=e180]: "-1"
              - generic [ref=e181]:
                - generic [ref=e182]: INT
                - generic [ref=e183]:
                  - generic [ref=e184]: base
                  - spinbutton "INT base score" [ref=e185]: "8"
                - generic [ref=e186]:
                  - generic [ref=e187]: racial
                  - generic [ref=e188]: "0"
                - generic [ref=e189]:
                  - generic [ref=e190]: total
                  - generic [ref=e191]: "8"
                - generic [ref=e192]:
                  - generic [ref=e193]: mod
                  - generic [ref=e194]: "-1"
                - generic [ref=e195]:
                  - generic [ref=e196]:
                    - generic [ref=e197]: temp
                    - spinbutton "INT temporary score" [ref=e198]
                  - generic [ref=e199]:
                    - generic [ref=e200]: temp mod
                    - generic [ref=e201]: "-1"
              - generic [ref=e202]:
                - generic [ref=e203]: WIS
                - generic [ref=e204]:
                  - generic [ref=e205]: base
                  - spinbutton "WIS base score" [ref=e206]: "8"
                - generic [ref=e207]:
                  - generic [ref=e208]: racial
                  - generic [ref=e209]: "0"
                - generic [ref=e210]:
                  - generic [ref=e211]: total
                  - generic [ref=e212]: "8"
                - generic [ref=e213]:
                  - generic [ref=e214]: mod
                  - generic [ref=e215]: "-1"
                - generic [ref=e216]:
                  - generic [ref=e217]:
                    - generic [ref=e218]: temp
                    - spinbutton "WIS temporary score" [ref=e219]
                  - generic [ref=e220]:
                    - generic [ref=e221]: temp mod
                    - generic [ref=e222]: "-1"
              - generic [ref=e223]:
                - generic [ref=e224]: CHA
                - generic [ref=e225]:
                  - generic [ref=e226]: base
                  - spinbutton "CHA base score" [ref=e227]: "8"
                - generic [ref=e228]:
                  - generic [ref=e229]: racial
                  - generic [ref=e230]: "0"
                - generic [ref=e231]:
                  - generic [ref=e232]: total
                  - generic [ref=e233]: "8"
                - generic [ref=e234]:
                  - generic [ref=e235]: mod
                  - generic [ref=e236]: "-1"
                - generic [ref=e237]:
                  - generic [ref=e238]:
                    - generic [ref=e239]: temp
                    - spinbutton "CHA temporary score" [ref=e240]
                  - generic [ref=e241]:
                    - generic [ref=e242]: temp mod
                    - generic [ref=e243]: "-1"
        - heading "Feats 0 features · 0 slots" [level=3] [ref=e245]:
          - button "Feats 0 features · 0 slots" [ref=e246] [cursor=pointer]:
            - img [ref=e247]
            - generic [ref=e249]: Feats
            - generic [ref=e250]: 0 features · 0 slots
        - heading "Combat AC 9 · Init -1 · F/R/W -1/-1/-1" [level=3] [ref=e252]:
          - button "Combat AC 9 · Init -1 · F/R/W -1/-1/-1" [ref=e253] [cursor=pointer]:
            - img [ref=e254]
            - generic [ref=e256]: Combat
            - generic [ref=e257]: AC 9 · Init -1 · F/R/W -1/-1/-1
        - heading "Inventory No items equipped" [level=3] [ref=e259]:
          - button "Inventory No items equipped" [ref=e260] [cursor=pointer]:
            - img [ref=e261]
            - generic [ref=e263]: Inventory
            - generic [ref=e264]: No items equipped
        - generic [ref=e265]:
          - heading "Skills" [level=3] [ref=e266]:
            - button "Skills" [expanded] [ref=e267] [cursor=pointer]:
              - img [ref=e268]
              - generic [ref=e270]: Skills
          - generic [ref=e272]:
            - generic [ref=e273]:
              - generic [ref=e274]: "0 / 0 points spent · 0 remaining · max ranks: class 3, cross-class 1.5"
              - button "Reset all ranks to 0" [ref=e275] [cursor=pointer]:
                - img [ref=e276]
            - table "Skills" [ref=e279]:
              - rowgroup [ref=e280]:
                - row "Trained only Skill Key Ability Class Score Bonus Ranks Misc Bonus" [ref=e281]:
                  - columnheader "Trained only" [ref=e282]
                  - columnheader "Skill" [ref=e283]
                  - columnheader "Key Ability" [ref=e284]
                  - columnheader "Class" [ref=e285]
                  - columnheader "Score" [ref=e286]
                  - columnheader "Bonus" [ref=e287]
                  - columnheader "Ranks" [ref=e288]
                  - columnheader "Misc Bonus" [ref=e289]
              - rowgroup [ref=e290]:
                - row "Appraise INT Appraise is class skill -1 -1 0 0" [ref=e291]:
                  - cell [ref=e292]
                  - cell "Appraise" [ref=e293]
                  - cell "INT" [ref=e294]
                  - cell "Appraise is class skill" [ref=e295]:
                    - checkbox "Appraise is class skill" [ref=e296]
                  - cell "-1" [ref=e297]
                  - cell "-1" [ref=e298]
                  - cell "0" [ref=e299]:
                    - spinbutton "Appraise ranks" [ref=e300]: "0"
                  - cell "0" [ref=e301]:
                    - spinbutton "Appraise misc bonus" [ref=e302]: "0"
                - row "Balance DEX Balance is class skill -1 -1 0 0" [ref=e303]:
                  - cell [ref=e304]
                  - cell "Balance" [ref=e305]
                  - cell "DEX" [ref=e306]
                  - cell "Balance is class skill" [ref=e307]:
                    - checkbox "Balance is class skill" [ref=e308]
                  - cell "-1" [ref=e309]
                  - cell "-1" [ref=e310]
                  - cell "0" [ref=e311]:
                    - spinbutton "Balance ranks" [ref=e312]: "0"
                  - cell "0" [ref=e313]:
                    - spinbutton "Balance misc bonus" [ref=e314]: "0"
                - row "Bluff CHA Bluff is class skill -1 -1 0 0" [ref=e315]:
                  - cell [ref=e316]
                  - cell "Bluff" [ref=e317]
                  - cell "CHA" [ref=e318]
                  - cell "Bluff is class skill" [ref=e319]:
                    - checkbox "Bluff is class skill" [ref=e320]
                  - cell "-1" [ref=e321]
                  - cell "-1" [ref=e322]
                  - cell "0" [ref=e323]:
                    - spinbutton "Bluff ranks" [ref=e324]: "0"
                  - cell "0" [ref=e325]:
                    - spinbutton "Bluff misc bonus" [ref=e326]: "0"
                - row "Climb STR Climb is class skill -1 -1 0 0" [ref=e327]:
                  - cell [ref=e328]
                  - cell "Climb" [ref=e329]
                  - cell "STR" [ref=e330]
                  - cell "Climb is class skill" [ref=e331]:
                    - checkbox "Climb is class skill" [ref=e332]
                  - cell "-1" [ref=e333]
                  - cell "-1" [ref=e334]
                  - cell "0" [ref=e335]:
                    - spinbutton "Climb ranks" [ref=e336]: "0"
                  - cell "0" [ref=e337]:
                    - spinbutton "Climb misc bonus" [ref=e338]: "0"
                - row "Concentration CON Concentration is class skill -1 -1 0 0" [ref=e339]:
                  - cell [ref=e340]
                  - cell "Concentration" [ref=e341]
                  - cell "CON" [ref=e342]
                  - cell "Concentration is class skill" [ref=e343]:
                    - checkbox "Concentration is class skill" [ref=e344]
                  - cell "-1" [ref=e345]
                  - cell "-1" [ref=e346]
                  - cell "0" [ref=e347]:
                    - spinbutton "Concentration ranks" [ref=e348]: "0"
                  - cell "0" [ref=e349]:
                    - spinbutton "Concentration misc bonus" [ref=e350]: "0"
                - row "Craft INT Craft is class skill -1 -1 0 0" [ref=e351]:
                  - cell [ref=e352]
                  - cell "Craft" [ref=e353]
                  - cell "INT" [ref=e354]
                  - cell "Craft is class skill" [ref=e355]:
                    - checkbox "Craft is class skill" [ref=e356]
                  - cell "-1" [ref=e357]
                  - cell "-1" [ref=e358]
                  - cell "0" [ref=e359]:
                    - spinbutton "Craft ranks" [ref=e360]: "0"
                  - cell "0" [ref=e361]:
                    - spinbutton "Craft misc bonus" [ref=e362]: "0"
                - row "T Decipher Script INT Decipher Script is class skill -1 -1 0 0" [ref=e363]:
                  - cell "T" [ref=e364]
                  - cell "Decipher Script" [ref=e365]
                  - cell "INT" [ref=e366]
                  - cell "Decipher Script is class skill" [ref=e367]:
                    - checkbox "Decipher Script is class skill" [ref=e368]
                  - cell "-1" [ref=e369]
                  - cell "-1" [ref=e370]
                  - cell "0" [ref=e371]:
                    - spinbutton "Decipher Script ranks" [ref=e372]: "0"
                  - cell "0" [ref=e373]:
                    - spinbutton "Decipher Script misc bonus" [ref=e374]: "0"
                - row "Diplomacy CHA Diplomacy is class skill -1 -1 0 0" [ref=e375]:
                  - cell [ref=e376]
                  - cell "Diplomacy" [ref=e377]
                  - cell "CHA" [ref=e378]
                  - cell "Diplomacy is class skill" [ref=e379]:
                    - checkbox "Diplomacy is class skill" [ref=e380]
                  - cell "-1" [ref=e381]
                  - cell "-1" [ref=e382]
                  - cell "0" [ref=e383]:
                    - spinbutton "Diplomacy ranks" [ref=e384]: "0"
                  - cell "0" [ref=e385]:
                    - spinbutton "Diplomacy misc bonus" [ref=e386]: "0"
                - row "T Disable Device INT Disable Device is class skill -1 -1 0 0" [ref=e387]:
                  - cell "T" [ref=e388]
                  - cell "Disable Device" [ref=e389]
                  - cell "INT" [ref=e390]
                  - cell "Disable Device is class skill" [ref=e391]:
                    - checkbox "Disable Device is class skill" [ref=e392]
                  - cell "-1" [ref=e393]
                  - cell "-1" [ref=e394]
                  - cell "0" [ref=e395]:
                    - spinbutton "Disable Device ranks" [ref=e396]: "0"
                  - cell "0" [ref=e397]:
                    - spinbutton "Disable Device misc bonus" [ref=e398]: "0"
                - row "Disguise CHA Disguise is class skill -1 -1 0 0" [ref=e399]:
                  - cell [ref=e400]
                  - cell "Disguise" [ref=e401]
                  - cell "CHA" [ref=e402]
                  - cell "Disguise is class skill" [ref=e403]:
                    - checkbox "Disguise is class skill" [ref=e404]
                  - cell "-1" [ref=e405]
                  - cell "-1" [ref=e406]
                  - cell "0" [ref=e407]:
                    - spinbutton "Disguise ranks" [ref=e408]: "0"
                  - cell "0" [ref=e409]:
                    - spinbutton "Disguise misc bonus" [ref=e410]: "0"
                - row "Escape Artist DEX Escape Artist is class skill -1 -1 0 0" [ref=e411]:
                  - cell [ref=e412]
                  - cell "Escape Artist" [ref=e413]
                  - cell "DEX" [ref=e414]
                  - cell "Escape Artist is class skill" [ref=e415]:
                    - checkbox "Escape Artist is class skill" [ref=e416]
                  - cell "-1" [ref=e417]
                  - cell "-1" [ref=e418]
                  - cell "0" [ref=e419]:
                    - spinbutton "Escape Artist ranks" [ref=e420]: "0"
                  - cell "0" [ref=e421]:
                    - spinbutton "Escape Artist misc bonus" [ref=e422]: "0"
                - row "Forgery INT Forgery is class skill -1 -1 0 0" [ref=e423]:
                  - cell [ref=e424]
                  - cell "Forgery" [ref=e425]
                  - cell "INT" [ref=e426]
                  - cell "Forgery is class skill" [ref=e427]:
                    - checkbox "Forgery is class skill" [ref=e428]
                  - cell "-1" [ref=e429]
                  - cell "-1" [ref=e430]
                  - cell "0" [ref=e431]:
                    - spinbutton "Forgery ranks" [ref=e432]: "0"
                  - cell "0" [ref=e433]:
                    - spinbutton "Forgery misc bonus" [ref=e434]: "0"
                - row "Gather Information CHA Gather Information is class skill -1 -1 0 0" [ref=e435]:
                  - cell [ref=e436]
                  - cell "Gather Information" [ref=e437]
                  - cell "CHA" [ref=e438]
                  - cell "Gather Information is class skill" [ref=e439]:
                    - checkbox "Gather Information is class skill" [ref=e440]
                  - cell "-1" [ref=e441]
                  - cell "-1" [ref=e442]
                  - cell "0" [ref=e443]:
                    - spinbutton "Gather Information ranks" [ref=e444]: "0"
                  - cell "0" [ref=e445]:
                    - spinbutton "Gather Information misc bonus" [ref=e446]: "0"
                - row "T Handle Animal CHA Handle Animal is class skill -1 -1 0 0" [ref=e447]:
                  - cell "T" [ref=e448]
                  - cell "Handle Animal" [ref=e449]
                  - cell "CHA" [ref=e450]
                  - cell "Handle Animal is class skill" [ref=e451]:
                    - checkbox "Handle Animal is class skill" [ref=e452]
                  - cell "-1" [ref=e453]
                  - cell "-1" [ref=e454]
                  - cell "0" [ref=e455]:
                    - spinbutton "Handle Animal ranks" [ref=e456]: "0"
                  - cell "0" [ref=e457]:
                    - spinbutton "Handle Animal misc bonus" [ref=e458]: "0"
                - row "Heal WIS Heal is class skill -1 -1 0 0" [ref=e459]:
                  - cell [ref=e460]
                  - cell "Heal" [ref=e461]
                  - cell "WIS" [ref=e462]
                  - cell "Heal is class skill" [ref=e463]:
                    - checkbox "Heal is class skill" [ref=e464]
                  - cell "-1" [ref=e465]
                  - cell "-1" [ref=e466]
                  - cell "0" [ref=e467]:
                    - spinbutton "Heal ranks" [ref=e468]: "0"
                  - cell "0" [ref=e469]:
                    - spinbutton "Heal misc bonus" [ref=e470]: "0"
                - row "Hide DEX Hide is class skill -1 -1 0 0" [ref=e471]:
                  - cell [ref=e472]
                  - cell "Hide" [ref=e473]
                  - cell "DEX" [ref=e474]
                  - cell "Hide is class skill" [ref=e475]:
                    - checkbox "Hide is class skill" [ref=e476]
                  - cell "-1" [ref=e477]
                  - cell "-1" [ref=e478]
                  - cell "0" [ref=e479]:
                    - spinbutton "Hide ranks" [ref=e480]: "0"
                  - cell "0" [ref=e481]:
                    - spinbutton "Hide misc bonus" [ref=e482]: "0"
                - row "Intimidate CHA Intimidate is class skill -1 -1 0 0" [ref=e483]:
                  - cell [ref=e484]
                  - cell "Intimidate" [ref=e485]
                  - cell "CHA" [ref=e486]
                  - cell "Intimidate is class skill" [ref=e487]:
                    - checkbox "Intimidate is class skill" [ref=e488]
                  - cell "-1" [ref=e489]
                  - cell "-1" [ref=e490]
                  - cell "0" [ref=e491]:
                    - spinbutton "Intimidate ranks" [ref=e492]: "0"
                  - cell "0" [ref=e493]:
                    - spinbutton "Intimidate misc bonus" [ref=e494]: "0"
                - row "Jump STR Jump is class skill -1 -1 0 0" [ref=e495]:
                  - cell [ref=e496]
                  - cell "Jump" [ref=e497]
                  - cell "STR" [ref=e498]
                  - cell "Jump is class skill" [ref=e499]:
                    - checkbox "Jump is class skill" [ref=e500]
                  - cell "-1" [ref=e501]
                  - cell "-1" [ref=e502]
                  - cell "0" [ref=e503]:
                    - spinbutton "Jump ranks" [ref=e504]: "0"
                  - cell "0" [ref=e505]:
                    - spinbutton "Jump misc bonus" [ref=e506]: "0"
                - row "T Knowledge (arcana) INT Knowledge (arcana) is class skill -1 -1 0 0" [ref=e507]:
                  - cell "T" [ref=e508]
                  - cell "Knowledge (arcana)" [ref=e509]
                  - cell "INT" [ref=e510]
                  - cell "Knowledge (arcana) is class skill" [ref=e511]:
                    - checkbox "Knowledge (arcana) is class skill" [ref=e512]
                  - cell "-1" [ref=e513]
                  - cell "-1" [ref=e514]
                  - cell "0" [ref=e515]:
                    - spinbutton "Knowledge (arcana) ranks" [ref=e516]: "0"
                  - cell "0" [ref=e517]:
                    - spinbutton "Knowledge (arcana) misc bonus" [ref=e518]: "0"
                - row "T Knowledge (architecture & engineering) INT Knowledge (architecture & engineering) is class skill -1 -1 0 0" [ref=e519]:
                  - cell "T" [ref=e520]
                  - cell "Knowledge (architecture & engineering)" [ref=e521]
                  - cell "INT" [ref=e522]
                  - cell "Knowledge (architecture & engineering) is class skill" [ref=e523]:
                    - checkbox "Knowledge (architecture & engineering) is class skill" [ref=e524]
                  - cell "-1" [ref=e525]
                  - cell "-1" [ref=e526]
                  - cell "0" [ref=e527]:
                    - spinbutton "Knowledge (architecture & engineering) ranks" [ref=e528]: "0"
                  - cell "0" [ref=e529]:
                    - spinbutton "Knowledge (architecture & engineering) misc bonus" [ref=e530]: "0"
                - row "T Knowledge (dungeoneering) INT Knowledge (dungeoneering) is class skill -1 -1 0 0" [ref=e531]:
                  - cell "T" [ref=e532]
                  - cell "Knowledge (dungeoneering)" [ref=e533]
                  - cell "INT" [ref=e534]
                  - cell "Knowledge (dungeoneering) is class skill" [ref=e535]:
                    - checkbox "Knowledge (dungeoneering) is class skill" [ref=e536]
                  - cell "-1" [ref=e537]
                  - cell "-1" [ref=e538]
                  - cell "0" [ref=e539]:
                    - spinbutton "Knowledge (dungeoneering) ranks" [ref=e540]: "0"
                  - cell "0" [ref=e541]:
                    - spinbutton "Knowledge (dungeoneering) misc bonus" [ref=e542]: "0"
                - row "T Knowledge (geography) INT Knowledge (geography) is class skill -1 -1 0 0" [ref=e543]:
                  - cell "T" [ref=e544]
                  - cell "Knowledge (geography)" [ref=e545]
                  - cell "INT" [ref=e546]
                  - cell "Knowledge (geography) is class skill" [ref=e547]:
                    - checkbox "Knowledge (geography) is class skill" [ref=e548]
                  - cell "-1" [ref=e549]
                  - cell "-1" [ref=e550]
                  - cell "0" [ref=e551]:
                    - spinbutton "Knowledge (geography) ranks" [ref=e552]: "0"
                  - cell "0" [ref=e553]:
                    - spinbutton "Knowledge (geography) misc bonus" [ref=e554]: "0"
                - row "T Knowledge (history) INT Knowledge (history) is class skill -1 -1 0 0" [ref=e555]:
                  - cell "T" [ref=e556]
                  - cell "Knowledge (history)" [ref=e557]
                  - cell "INT" [ref=e558]
                  - cell "Knowledge (history) is class skill" [ref=e559]:
                    - checkbox "Knowledge (history) is class skill" [ref=e560]
                  - cell "-1" [ref=e561]
                  - cell "-1" [ref=e562]
                  - cell "0" [ref=e563]:
                    - spinbutton "Knowledge (history) ranks" [ref=e564]: "0"
                  - cell "0" [ref=e565]:
                    - spinbutton "Knowledge (history) misc bonus" [ref=e566]: "0"
                - row "T Knowledge (local) INT Knowledge (local) is class skill -1 -1 0 0" [ref=e567]:
                  - cell "T" [ref=e568]
                  - cell "Knowledge (local)" [ref=e569]
                  - cell "INT" [ref=e570]
                  - cell "Knowledge (local) is class skill" [ref=e571]:
                    - checkbox "Knowledge (local) is class skill" [ref=e572]
                  - cell "-1" [ref=e573]
                  - cell "-1" [ref=e574]
                  - cell "0" [ref=e575]:
                    - spinbutton "Knowledge (local) ranks" [ref=e576]: "0"
                  - cell "0" [ref=e577]:
                    - spinbutton "Knowledge (local) misc bonus" [ref=e578]: "0"
                - row "T Knowledge (nature) INT Knowledge (nature) is class skill -1 -1 0 0" [ref=e579]:
                  - cell "T" [ref=e580]
                  - cell "Knowledge (nature)" [ref=e581]
                  - cell "INT" [ref=e582]
                  - cell "Knowledge (nature) is class skill" [ref=e583]:
                    - checkbox "Knowledge (nature) is class skill" [ref=e584]
                  - cell "-1" [ref=e585]
                  - cell "-1" [ref=e586]
                  - cell "0" [ref=e587]:
                    - spinbutton "Knowledge (nature) ranks" [ref=e588]: "0"
                  - cell "0" [ref=e589]:
                    - spinbutton "Knowledge (nature) misc bonus" [ref=e590]: "0"
                - row "T Knowledge (nobility & royalty) INT Knowledge (nobility & royalty) is class skill -1 -1 0 0" [ref=e591]:
                  - cell "T" [ref=e592]
                  - cell "Knowledge (nobility & royalty)" [ref=e593]
                  - cell "INT" [ref=e594]
                  - cell "Knowledge (nobility & royalty) is class skill" [ref=e595]:
                    - checkbox "Knowledge (nobility & royalty) is class skill" [ref=e596]
                  - cell "-1" [ref=e597]
                  - cell "-1" [ref=e598]
                  - cell "0" [ref=e599]:
                    - spinbutton "Knowledge (nobility & royalty) ranks" [ref=e600]: "0"
                  - cell "0" [ref=e601]:
                    - spinbutton "Knowledge (nobility & royalty) misc bonus" [ref=e602]: "0"
                - row "T Knowledge (religion) INT Knowledge (religion) is class skill -1 -1 0 0" [ref=e603]:
                  - cell "T" [ref=e604]
                  - cell "Knowledge (religion)" [ref=e605]
                  - cell "INT" [ref=e606]
                  - cell "Knowledge (religion) is class skill" [ref=e607]:
                    - checkbox "Knowledge (religion) is class skill" [ref=e608]
                  - cell "-1" [ref=e609]
                  - cell "-1" [ref=e610]
                  - cell "0" [ref=e611]:
                    - spinbutton "Knowledge (religion) ranks" [ref=e612]: "0"
                  - cell "0" [ref=e613]:
                    - spinbutton "Knowledge (religion) misc bonus" [ref=e614]: "0"
                - row "T Knowledge (the planes) INT Knowledge (the planes) is class skill -1 -1 0 0" [ref=e615]:
                  - cell "T" [ref=e616]
                  - cell "Knowledge (the planes)" [ref=e617]
                  - cell "INT" [ref=e618]
                  - cell "Knowledge (the planes) is class skill" [ref=e619]:
                    - checkbox "Knowledge (the planes) is class skill" [ref=e620]
                  - cell "-1" [ref=e621]
                  - cell "-1" [ref=e622]
                  - cell "0" [ref=e623]:
                    - spinbutton "Knowledge (the planes) ranks" [ref=e624]: "0"
                  - cell "0" [ref=e625]:
                    - spinbutton "Knowledge (the planes) misc bonus" [ref=e626]: "0"
                - row "Listen WIS Listen is class skill -1 -1 0 0" [ref=e627]:
                  - cell [ref=e628]
                  - cell "Listen" [ref=e629]
                  - cell "WIS" [ref=e630]
                  - cell "Listen is class skill" [ref=e631]:
                    - checkbox "Listen is class skill" [ref=e632]
                  - cell "-1" [ref=e633]
                  - cell "-1" [ref=e634]
                  - cell "0" [ref=e635]:
                    - spinbutton "Listen ranks" [ref=e636]: "0"
                  - cell "0" [ref=e637]:
                    - spinbutton "Listen misc bonus" [ref=e638]: "0"
                - row "Move Silently DEX Move Silently is class skill -1 -1 0 0" [ref=e639]:
                  - cell [ref=e640]
                  - cell "Move Silently" [ref=e641]
                  - cell "DEX" [ref=e642]
                  - cell "Move Silently is class skill" [ref=e643]:
                    - checkbox "Move Silently is class skill" [ref=e644]
                  - cell "-1" [ref=e645]
                  - cell "-1" [ref=e646]
                  - cell "0" [ref=e647]:
                    - spinbutton "Move Silently ranks" [ref=e648]: "0"
                  - cell "0" [ref=e649]:
                    - spinbutton "Move Silently misc bonus" [ref=e650]: "0"
                - row "T Open Lock DEX Open Lock is class skill -1 -1 0 0" [ref=e651]:
                  - cell "T" [ref=e652]
                  - cell "Open Lock" [ref=e653]
                  - cell "DEX" [ref=e654]
                  - cell "Open Lock is class skill" [ref=e655]:
                    - checkbox "Open Lock is class skill" [ref=e656]
                  - cell "-1" [ref=e657]
                  - cell "-1" [ref=e658]
                  - cell "0" [ref=e659]:
                    - spinbutton "Open Lock ranks" [ref=e660]: "0"
                  - cell "0" [ref=e661]:
                    - spinbutton "Open Lock misc bonus" [ref=e662]: "0"
                - row "Perform CHA Perform is class skill -1 -1 0 0" [ref=e663]:
                  - cell [ref=e664]
                  - cell "Perform" [ref=e665]
                  - cell "CHA" [ref=e666]
                  - cell "Perform is class skill" [ref=e667]:
                    - checkbox "Perform is class skill" [ref=e668]
                  - cell "-1" [ref=e669]
                  - cell "-1" [ref=e670]
                  - cell "0" [ref=e671]:
                    - spinbutton "Perform ranks" [ref=e672]: "0"
                  - cell "0" [ref=e673]:
                    - spinbutton "Perform misc bonus" [ref=e674]: "0"
                - row "T Profession WIS Profession is class skill -1 -1 0 0" [ref=e675]:
                  - cell "T" [ref=e676]
                  - cell "Profession" [ref=e677]
                  - cell "WIS" [ref=e678]
                  - cell "Profession is class skill" [ref=e679]:
                    - checkbox "Profession is class skill" [ref=e680]
                  - cell "-1" [ref=e681]
                  - cell "-1" [ref=e682]
                  - cell "0" [ref=e683]:
                    - spinbutton "Profession ranks" [ref=e684]: "0"
                  - cell "0" [ref=e685]:
                    - spinbutton "Profession misc bonus" [ref=e686]: "0"
                - row "Ride DEX Ride is class skill -1 -1 0 0" [ref=e687]:
                  - cell [ref=e688]
                  - cell "Ride" [ref=e689]
                  - cell "DEX" [ref=e690]
                  - cell "Ride is class skill" [ref=e691]:
                    - checkbox "Ride is class skill" [ref=e692]
                  - cell "-1" [ref=e693]
                  - cell "-1" [ref=e694]
                  - cell "0" [ref=e695]:
                    - spinbutton "Ride ranks" [ref=e696]: "0"
                  - cell "0" [ref=e697]:
                    - spinbutton "Ride misc bonus" [ref=e698]: "0"
                - row "Search INT Search is class skill -1 -1 0 0" [ref=e699]:
                  - cell [ref=e700]
                  - cell "Search" [ref=e701]
                  - cell "INT" [ref=e702]
                  - cell "Search is class skill" [ref=e703]:
                    - checkbox "Search is class skill" [ref=e704]
                  - cell "-1" [ref=e705]
                  - cell "-1" [ref=e706]
                  - cell "0" [ref=e707]:
                    - spinbutton "Search ranks" [ref=e708]: "0"
                  - cell "0" [ref=e709]:
                    - spinbutton "Search misc bonus" [ref=e710]: "0"
                - row "Sense Motive WIS Sense Motive is class skill -1 -1 0 0" [ref=e711]:
                  - cell [ref=e712]
                  - cell "Sense Motive" [ref=e713]
                  - cell "WIS" [ref=e714]
                  - cell "Sense Motive is class skill" [ref=e715]:
                    - checkbox "Sense Motive is class skill" [ref=e716]
                  - cell "-1" [ref=e717]
                  - cell "-1" [ref=e718]
                  - cell "0" [ref=e719]:
                    - spinbutton "Sense Motive ranks" [ref=e720]: "0"
                  - cell "0" [ref=e721]:
                    - spinbutton "Sense Motive misc bonus" [ref=e722]: "0"
                - row "T Sleight of Hand DEX Sleight of Hand is class skill -1 -1 0 0" [ref=e723]:
                  - cell "T" [ref=e724]
                  - cell "Sleight of Hand" [ref=e725]
                  - cell "DEX" [ref=e726]
                  - cell "Sleight of Hand is class skill" [ref=e727]:
                    - checkbox "Sleight of Hand is class skill" [ref=e728]
                  - cell "-1" [ref=e729]
                  - cell "-1" [ref=e730]
                  - cell "0" [ref=e731]:
                    - spinbutton "Sleight of Hand ranks" [ref=e732]: "0"
                  - cell "0" [ref=e733]:
                    - spinbutton "Sleight of Hand misc bonus" [ref=e734]: "0"
                - row "T Speak Language 0 Speak Language is class skill 0 +0 0 0" [ref=e735]:
                  - cell "T" [ref=e736]
                  - cell "Speak Language" [ref=e737]
                  - cell "0" [ref=e738]
                  - cell "Speak Language is class skill" [ref=e739]:
                    - checkbox "Speak Language is class skill" [ref=e740]
                  - cell "0" [ref=e741]
                  - cell "+0" [ref=e742]
                  - cell "0" [ref=e743]:
                    - spinbutton "Speak Language ranks" [ref=e744]: "0"
                  - cell "0" [ref=e745]:
                    - spinbutton "Speak Language misc bonus" [ref=e746]: "0"
                - row "T Spellcraft INT Spellcraft is class skill -1 -1 0 0" [ref=e747]:
                  - cell "T" [ref=e748]
                  - cell "Spellcraft" [ref=e749]
                  - cell "INT" [ref=e750]
                  - cell "Spellcraft is class skill" [ref=e751]:
                    - checkbox "Spellcraft is class skill" [ref=e752]
                  - cell "-1" [ref=e753]
                  - cell "-1" [ref=e754]
                  - cell "0" [ref=e755]:
                    - spinbutton "Spellcraft ranks" [ref=e756]: "0"
                  - cell "0" [ref=e757]:
                    - spinbutton "Spellcraft misc bonus" [ref=e758]: "0"
                - row "Spot WIS Spot is class skill -1 -1 0 0" [ref=e759]:
                  - cell [ref=e760]
                  - cell "Spot" [ref=e761]
                  - cell "WIS" [ref=e762]
                  - cell "Spot is class skill" [ref=e763]:
                    - checkbox "Spot is class skill" [ref=e764]
                  - cell "-1" [ref=e765]
                  - cell "-1" [ref=e766]
                  - cell "0" [ref=e767]:
                    - spinbutton "Spot ranks" [ref=e768]: "0"
                  - cell "0" [ref=e769]:
                    - spinbutton "Spot misc bonus" [ref=e770]: "0"
                - row "Survival WIS Survival is class skill -1 -1 0 0" [ref=e771]:
                  - cell [ref=e772]
                  - cell "Survival" [ref=e773]
                  - cell "WIS" [ref=e774]
                  - cell "Survival is class skill" [ref=e775]:
                    - checkbox "Survival is class skill" [ref=e776]
                  - cell "-1" [ref=e777]
                  - cell "-1" [ref=e778]
                  - cell "0" [ref=e779]:
                    - spinbutton "Survival ranks" [ref=e780]: "0"
                  - cell "0" [ref=e781]:
                    - spinbutton "Survival misc bonus" [ref=e782]: "0"
                - row "Swim STR Swim is class skill -1 -1 0 0" [ref=e783]:
                  - cell [ref=e784]
                  - cell "Swim" [ref=e785]
                  - cell "STR" [ref=e786]
                  - cell "Swim is class skill" [ref=e787]:
                    - checkbox "Swim is class skill" [ref=e788]
                  - cell "-1" [ref=e789]
                  - cell "-1" [ref=e790]
                  - cell "0" [ref=e791]:
                    - spinbutton "Swim ranks" [ref=e792]: "0"
                  - cell "0" [ref=e793]:
                    - spinbutton "Swim misc bonus" [ref=e794]: "0"
                - row "T Tumble DEX Tumble is class skill -1 -1 0 0" [ref=e795]:
                  - cell "T" [ref=e796]
                  - cell "Tumble" [ref=e797]
                  - cell "DEX" [ref=e798]
                  - cell "Tumble is class skill" [ref=e799]:
                    - checkbox "Tumble is class skill" [ref=e800]
                  - cell "-1" [ref=e801]
                  - cell "-1" [ref=e802]
                  - cell "0" [ref=e803]:
                    - spinbutton "Tumble ranks" [ref=e804]: "0"
                  - cell "0" [ref=e805]:
                    - spinbutton "Tumble misc bonus" [ref=e806]: "0"
                - row "T Use Magic Device CHA Use Magic Device is class skill -1 -1 0 0" [ref=e807]:
                  - cell "T" [ref=e808]
                  - cell "Use Magic Device" [ref=e809]
                  - cell "CHA" [ref=e810]
                  - cell "Use Magic Device is class skill" [ref=e811]:
                    - checkbox "Use Magic Device is class skill" [ref=e812]
                  - cell "-1" [ref=e813]
                  - cell "-1" [ref=e814]
                  - cell "0" [ref=e815]:
                    - spinbutton "Use Magic Device ranks" [ref=e816]: "0"
                  - cell "0" [ref=e817]:
                    - spinbutton "Use Magic Device misc bonus" [ref=e818]: "0"
                - row "Use Rope DEX Use Rope is class skill -1 -1 0 0" [ref=e819]:
                  - cell [ref=e820]
                  - cell "Use Rope" [ref=e821]
                  - cell "DEX" [ref=e822]
                  - cell "Use Rope is class skill" [ref=e823]:
                    - checkbox "Use Rope is class skill" [ref=e824]
                  - cell "-1" [ref=e825]
                  - cell "-1" [ref=e826]
                  - cell "0" [ref=e827]:
                    - spinbutton "Use Rope ranks" [ref=e828]: "0"
                  - cell "0" [ref=e829]:
                    - spinbutton "Use Rope misc bonus" [ref=e830]: "0"
        - heading "Background" [level=3] [ref=e832]:
          - button "Background" [ref=e833] [cursor=pointer]:
            - img [ref=e834]
            - generic [ref=e836]: Background
  - complementary [ref=e837]:
    - generic [ref=e838]:
      - heading "Settings" [level=3] [ref=e839]
      - button "Close" [ref=e840] [cursor=pointer]
    - generic [ref=e842]:
      - generic [ref=e843]: Theme
      - switch "Theme toggle" [ref=e844] [cursor=pointer]:
        - generic [ref=e846]:
          - generic [ref=e847]: Light
          - generic [ref=e848]: Dark
    - generic [ref=e850]:
      - heading "Rules" [level=3] [ref=e851]
      - paragraph [ref=e852]: Point Buy System
      - button "28-point" [ref=e854] [cursor=pointer]:
        - generic [ref=e855]: 28-point
        - img [ref=e856]
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import { mockAuth, gotoApp } from './fixtures';
  3   | 
  4   | /** Navigates to the app and opens the New Character editor. */
  5   | async function openEditor(page: Page) {
  6   |   await gotoApp(page, []);
  7   |   await page.getByRole('button', { name: '+ New' }).click();
  8   |   await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
  9   | }
  10  | 
  11  | /** Selects a class in the class dropdown. */
  12  | async function selectClass(page: Page, className: string) {
  13  |   await page.locator('select').filter({ hasText: '— Select class —' }).selectOption(className);
  14  | }
  15  | 
  16  | function abilityRow(page: Page, label: string) {
  17  |   return page.locator('div.flex.items-center.gap-3').filter({
  18  |     has: page.locator('span.w-8', { hasText: label }),
  19  |   });
  20  | }
  21  | 
  22  | test.describe('Character Editor', () => {
  23  |   test.describe('Layout', () => {
  24  |     test('shows the New Character heading', async ({ page }) => {
  25  |       await openEditor(page);
  26  | 
  27  |       await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
  28  |     });
  29  | 
  30  |     test('shows the Identity section with a Name field', async ({ page }) => {
  31  |       await openEditor(page);
  32  | 
  33  |       await expect(page.getByRole('heading', { name: /identity/i, level: 3 })).toBeVisible();
  34  |       await expect(page.getByPlaceholder('Character name')).toBeVisible();
  35  |     });
  36  | 
  37  |     test('shows the Class & Level section', async ({ page }) => {
  38  |       await openEditor(page);
  39  | 
  40  |       await expect(page.getByRole('heading', { name: /class/i, level: 3 })).toBeVisible();
  41  |     });
  42  | 
  43  |     test('shows a derived hit points field under the class selector instead of a hit points section', async ({ page }) => {
  44  |       await openEditor(page);
  45  | 
  46  |       await expect(page.getByRole('heading', { name: /^Hit Points$/i, level: 3 })).toHaveCount(0);
  47  |       await expect(page.getByRole('textbox', { name: 'Hit Points' })).toBeVisible();
  48  |       await expect(page.getByRole('textbox', { name: 'Hit Points' })).toHaveValue('0');
  49  |     });
  50  | 
  51  |     test('shows Ability Score rows (STR, DEX, CON, INT, WIS, CHA)', async ({ page }) => {
  52  |       await openEditor(page);
  53  | 
  54  |       const heading = page.getByRole('heading', { name: /ability scores/i, level: 3 });
  55  |       await expect(heading).toBeVisible();
  56  | 
  57  |       // Scope to the ability scores section — the labels are <span class="w-8 ...">
  58  |       // Avoid collision with the Skills table which also shows "STR", "DEX", etc. in key ability cells
  59  |       for (const label of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) {
> 60  |         await expect(page.locator('span.w-8', { hasText: label })).toBeVisible();
      |                                                                    ^ Error: expect(locator).toBeVisible() failed
  61  |       }
  62  |     });
  63  | 
  64  |     test('starts all base ability scores at 8 and shows full 28-point budget remaining', async ({ page }) => {
  65  |       await openEditor(page);
  66  | 
  67  |       for (const label of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) {
  68  |         await expect(abilityRow(page, label).locator('input[type="number"]').first()).toHaveValue('8');
  69  |       }
  70  | 
  71  |       await expect(page.getByText('0 / 28 points spent · 28 remaining')).toBeVisible();
  72  |     });
  73  | 
  74  |     test('shows the Skills section with a table', async ({ page }) => {
  75  |       await openEditor(page);
  76  | 
  77  |       await expect(page.getByRole('heading', { name: /skills/i, level: 3 })).toBeVisible();
  78  |       await expect(page.getByRole('columnheader', { name: 'Skill' })).toBeVisible();
  79  |       await expect(page.getByRole('columnheader', { name: 'Ranks' })).toBeVisible();
  80  |       await expect(page.getByRole('columnheader', { name: 'Bonus', exact: true })).toBeVisible();
  81  |     });
  82  | 
  83  |     test('shows both Cancel buttons (top and bottom of form)', async ({ page }) => {
  84  |       await openEditor(page);
  85  | 
  86  |       await expect(page.getByRole('button', { name: 'Back to characters' })).toBeVisible();
  87  |     });
  88  |   });
  89  | 
  90  |   test.describe('Navigation', () => {
  91  |     test('back button returns to the character list', async ({ page }) => {
  92  |       await openEditor(page);
  93  | 
  94  |       await page.getByRole('button', { name: 'Back to characters' }).click();
  95  |       await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();
  96  |     });
  97  | 
  98  |     test('Character Editor nav menu → Characters returns to the character list', async ({ page }) => {
  99  |       await openEditor(page);
  100 | 
  101 |       await page.getByRole('button', { name: 'Character Editor' }).click();
  102 |       await page.getByRole('menuitem', { name: 'Characters' }).click();
  103 |       await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();
  104 |     });
  105 |   });
  106 | 
  107 |   test.describe('Form Validation', () => {
  108 |     test('autosave does not fire when name and class are empty', async ({ page }) => {
  109 |       let postCount = 0;
  110 |       await mockAuth(page);
  111 |       await page.route('**/api/characters', async (route) => {
  112 |         if (route.request().method() === 'POST') { postCount++; }
  113 |         await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  114 |       });
  115 |       await page.goto('/');
  116 |       await page.getByRole('button', { name: '+ New' }).click();
  117 |       await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
  118 |       await page.waitForTimeout(800);
  119 |       expect(postCount).toBe(0);
  120 |     });
  121 | 
  122 |     test('autosave does not fire when name is filled but no class selected', async ({ page }) => {
  123 |       let postCount = 0;
  124 |       await mockAuth(page);
  125 |       await page.route('**/api/characters', async (route) => {
  126 |         if (route.request().method() === 'POST') { postCount++; }
  127 |         await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  128 |       });
  129 |       await page.goto('/');
  130 |       await page.getByRole('button', { name: '+ New' }).click();
  131 |       await page.getByPlaceholder('Character name').fill('Thorin');
  132 |       await page.waitForTimeout(800);
  133 |       expect(postCount).toBe(0);
  134 |     });
  135 | 
  136 |     test('autosave does not fire when class is selected but name is empty', async ({ page }) => {
  137 |       let postCount = 0;
  138 |       await mockAuth(page);
  139 |       await page.route('**/api/characters', async (route) => {
  140 |         if (route.request().method() === 'POST') { postCount++; }
  141 |         await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  142 |       });
  143 |       await page.goto('/');
  144 |       await page.getByRole('button', { name: '+ New' }).click();
  145 |       await selectClass(page, 'Rogue');
  146 |       await page.waitForTimeout(800);
  147 |       expect(postCount).toBe(0);
  148 |     });
  149 | 
  150 |     test('autosave fires when both name and class are filled', async ({ page }) => {
  151 |       await mockAuth(page);
  152 |       await page.route('**/api/characters', async (route) => {
  153 |         if (route.request().method() === 'POST') {
  154 |           await route.fulfill({
  155 |             status: 201,
  156 |             contentType: 'application/json',
  157 |             body: JSON.stringify({ _id: 'new-id', name: 'Thorin', classes: [{ name: 'Fighter', level: 1 }], updatedAt: new Date().toISOString() }),
  158 |           });
  159 |         } else {
  160 |           await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
```