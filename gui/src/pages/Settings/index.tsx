import React, { useContext, useEffect, useState } from "react"
import { Autocomplete, Button, Checkbox, Fade, FormControlLabel, FormGroup, FormHelperText, Grid, MenuItem, Modal, Stack, TextField, Typography } from "@mui/material"
import { Box, styled } from "@mui/system"
import "./index.scss"
import TransferList from "../../components/TransferList"
import parse from "autosuggest-highlight/parse"
import match from "autosuggest-highlight/match"
import { BotStateContext } from "../../context/BotStateContext"
import { FsTextFileOption, readTextFile, writeFile } from "@tauri-apps/api/fs"

// Custom input component for combat script file selection.
const Input = styled("input")({
    display: "none",
})

const Settings = () => {
    const [fileName, setFileName] = useState("")
    const [combatScript, setCombatScript] = useState("")
    const [farmingMode, setFarmingMode] = useState("")
    const [item, setItem] = useState<string | null>(null)
    const [mission, setMission] = useState("")
    const [itemAmount, setItemAmount] = useState(0)
    const [groupNumber, setGroupNumber] = useState(1)
    const [partyNumber, setPartyNumber] = useState(1)
    const [debugMode, setDebugMode] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const { status } = useContext(BotStateContext)
    const [, setReadyStatus] = status

    const farmingModes = ["Quest", "Special"]
    const itemsForQuest = ["Satin Feather", "Zephyr Feather", "Flying Sprout"]
    const missionsForQuest = ["test1"]

    // Load the selected combat script text file.
    const loadCombatScript = (event: React.ChangeEvent<HTMLInputElement>) => {
        var files = event.currentTarget.files
        if (files != null) {
            var file = files[0]
            if (file == null) {
                // Reset the combat script selected if none was selected from the file picker dialog.
                setFileName("")
            } else {
                setFileName(file.name)

                // Create the FileReader object and setup the function that will run after the FileReader reads the text file.
                var reader = new FileReader()
                reader.onload = function (loadedEvent) {
                    if (loadedEvent.target?.result != null) {
                        console.log("Loaded Combat Script: ", loadedEvent.target?.result)
                        setCombatScript(loadedEvent.target?.result?.toString())
                    } else {
                        console.log("Failed to read combat script. Reseting to default empty combat script...")
                        setFileName("")
                        setCombatScript("")
                    }
                }

                // Read the text contents of the file.
                reader.readAsText(file)

                // TODO: Send contents of combat script file to backend.
            }
        }
    }

    // Load settings from JSON file.
    useEffect(() => {
        try {
            readTextFile("settings.json")
                .then((settings) => {
                    interface ParsedSettings {
                        currentCombatScriptName: string
                        currentCombatScript: string
                        farmingMode: string
                        item: string
                        mission: string
                        itemAmount: number
                        groupNumber: number
                        partyNumber: number
                        debugMode: boolean
                    }

                    const decoded: ParsedSettings = JSON.parse(settings)
                    console.log(`Loaded settings: ${settings}`)

                    setFileName(decoded.currentCombatScriptName)
                    setCombatScript(decoded.currentCombatScript)
                    setFarmingMode(decoded.farmingMode)
                    setItem(decoded.item)
                    setMission(decoded.mission)
                    setItemAmount(decoded.itemAmount)
                    setGroupNumber(decoded.groupNumber)
                    setPartyNumber(decoded.partyNumber)
                    setDebugMode(decoded.debugMode)
                })
                .catch((err) => {
                    console.log(`Encountered read exception: ${err}`)
                })
        } catch (e) {
            console.log(`Encountered exception while loading settings from local JSON file:\n${e}`)
        }
    }, [])

    // Save current settings to JSON file.
    useEffect(() => {
        try {
            const settings = {
                currentCombatScriptName: fileName,
                currentCombatScript: combatScript,
                farmingMode: farmingMode,
                item: item,
                mission: mission,
                itemAmount: itemAmount,
                groupNumber: groupNumber,
                partyNumber: partyNumber,
                debugMode: debugMode,
            }

            // Stringify the contents and prepare for writing to the specified file.
            const jsonString = JSON.stringify(settings, null, 4)
            const settingsFile: FsTextFileOption = { path: "settings.json", contents: jsonString }

            writeFile(settingsFile)
                .then(() => {
                    console.log(`Successfully saved settings to settings.json`)
                })
                .catch((err) => {
                    console.log(`Encountered write exception: ${err}`)
                })
        } catch (e) {
            console.log(`Encountered exception while saving settings to local JSON file:\n${e}`)
        }
    }, [fileName, combatScript, farmingMode, item, mission, itemAmount, groupNumber, partyNumber, debugMode])

    // Show or hide the Support Summon Selection component.
    const handleModalOpen = () => setIsModalOpen(true)
    const handleModalClose = () => setIsModalOpen(false)

    return (
        <Fade in={true}>
            <Box className="container" id="settingsContainer">
                <Stack spacing={2} className="wrapper">
                    <Grid container spacing={4} justifyContent="center" alignItems="center">
                        {/* Load Combat Script */}
                        <Grid item md>
                            <TextField variant="filled" label="Combat Script" value={fileName} inputProps={{ readOnly: true }} helperText="Selected Combat Script" />
                        </Grid>
                        <Grid item xs>
                            <label htmlFor="combat-script-loader">
                                <Input accept=".txt" id="combat-script-loader" type="file" onChange={(e) => loadCombatScript(e)} />
                                <Button variant="contained" component="span">
                                    Load Combat Script
                                </Button>
                            </label>
                        </Grid>
                    </Grid>

                    {/* Select Farming Mode */}
                    <TextField select label="Farming Mode" variant="filled" value={farmingMode} onChange={(e) => setFarmingMode(e.target.value)} helperText="Please select the Farming Mode">
                        {farmingModes.map((mode) => (
                            <MenuItem key={mode} value={mode}>
                                {mode}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Select Item */}
                    <Autocomplete
                        options={itemsForQuest.map((element) => element)}
                        value={item}
                        onChange={(_e, value) => setItem(value)}
                        getOptionLabel={(option) => option}
                        renderInput={(params) => <TextField {...params} label="Select Item" variant="filled" helperText="Please select/search the Item to farm" />}
                        renderOption={(props, option, { inputValue }) => {
                            const matches = match(option, inputValue)
                            const parts = parse(option, matches)

                            return (
                                <li {...props}>
                                    <div>
                                        {parts.map((part, index) => (
                                            <span key={index} style={{ fontWeight: part.highlight ? 1000 : 400 }}>
                                                {part.text}
                                            </span>
                                        ))}
                                    </div>
                                </li>
                            )
                        }}
                    />

                    {/* Select Mission */}
                    <TextField select label="Mission" variant="filled" value={mission} onChange={(e) => setMission(e.target.value)} helperText="Please select the Mission">
                        {missionsForQuest.map((mode) => (
                            <MenuItem key={mode} value={mode}>
                                {mode}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Select # of Items to farm */}
                    <TextField
                        label="# of Items"
                        type="number"
                        variant="filled"
                        value={itemAmount}
                        onChange={(e) => setItemAmount(e.target.value === "" ? 0 : parseInt(e.target.value))}
                        inputProps={{ min: 0 }}
                        helperText="Please select the amount of Items to farm"
                    />

                    {/* Select Summon(s) */}
                    <Button variant="contained" onClick={handleModalOpen}>
                        Select Summons
                    </Button>
                    <Modal className="modal" open={isModalOpen} onClose={handleModalClose}>
                        <div>
                            <Typography>Select Support Summon(s)</Typography>
                            <Box id="modalContainer" className="box">
                                <TransferList />
                            </Box>
                        </div>
                    </Modal>

                    {/* Select Group and Party */}
                    <Grid container justifyContent="center" alignItems="center">
                        <Grid item id="gridItemGroup" xs={4}>
                            <TextField
                                label="Group #"
                                variant="filled"
                                type="number"
                                error={groupNumber < 1 || groupNumber > 7}
                                defaultValue={1}
                                inputProps={{ min: 1, max: 7 }}
                                onChange={(e) => setGroupNumber(parseInt(e.target.value))}
                                helperText="From 1 to 7"
                                className="textfield"
                            />
                        </Grid>
                        <Grid item md></Grid>
                        <Grid item id="gridItemParty" xs={4}>
                            <TextField
                                label="Party #"
                                variant="filled"
                                type="number"
                                error={partyNumber < 1 || partyNumber > 6}
                                defaultValue={1}
                                inputProps={{ min: 1, max: 6 }}
                                onChange={(e) => setPartyNumber(parseInt(e.target.value))}
                                helperText="From 1 to 6"
                                className="textfield"
                            />
                        </Grid>
                    </Grid>

                    {/* Debug Mode */}
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    onChange={(e) => {
                                        setDebugMode(e.target.checked)

                                        // TODO: Create proper logic to enable the ready status.
                                        setReadyStatus(e.target.checked)
                                    }}
                                    checked={debugMode}
                                />
                            }
                            label="Enable Debug Mode"
                        />
                        <FormHelperText>Enables debugging messages to show up in the log</FormHelperText>
                    </FormGroup>
                </Stack>
            </Box>
        </Fade>
    )
}

export default Settings
