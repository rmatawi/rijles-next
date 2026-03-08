I need a function in MaquetteEdit.jsx to count the total occurences of "type": "car" or "type": "bike".
If the input parameter is "bike" find only bikes.
If the input parameter is "car" find only cars.

{
    "groupName": "Regels wegsituatie Smal / Breed",
    "answer": "<p>1 + 2<br>De \"+\" betekent: <strong>samen met</strong>.<br>Dus 1 rijdt <strong>samen met</strong> 2.</p>",
    "importantNotes": "",
    "roadsize": "S/B",
    "sequence": "1+2",
    "top": {
        "vehicles": [
            [
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_1",
                    "name": "S1"
                },
                {
                    "type": "car",
                    "direction": "straight",
                    "name": "1",
                    "id": "car_2"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_3",
                    "name": "S3"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_4",
                    "name": "S4"
                }
            ],
            [
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_5",
                    "name": "S5"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_6",
                    "name": "S6"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_7",
                    "name": "S7"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_8",
                    "name": "S8"
                }
            ],
            [
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_9",
                    "name": "S9"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_10",
                    "name": "S10"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_11",
                    "name": "S11"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_12",
                    "name": "S12"
                }
            ]
        ]
    },
    "bottom": {
        "note": "",
        "vehicles": [
            [
                {
                    "type": "car",
                    "name": "Auto",
                    "direction": "left",
                    "id": "space_13"
                },
                {
                    "type": "car",
                    "direction": "straight",
                    "name": "2",
                    "id": "car_14"
                },
                {
                    "type": "space",
                    "name": "S15",
                    "direction": "straight",
                    "id": "space_15"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_16",
                    "name": "S16"
                }
            ],
            [
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_17",
                    "name": "S17"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_18",
                    "name": "S18"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_19",
                    "name": "S19"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_20",
                    "name": "S20"
                }
            ],
            [
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_21",
                    "name": "S21"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_22",
                    "name": "S22"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_23",
                    "name": "S23"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_24",
                    "name": "S24"
                }
            ]
        ]
    },
    "left": {
        "note": "",
        "vehicles": [
            [
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_25",
                    "name": "S25"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_26",
                    "name": "S26"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_27",
                    "name": "S27"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_28",
                    "name": "S28"
                }
            ],
            [
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_29",
                    "name": "S29"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_30",
                    "name": "S30"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_31",
                    "name": "S31"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_32",
                    "name": "S32"
                }
            ],
            [
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_33",
                    "name": "S33"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_34",
                    "name": "S34"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_35",
                    "name": "S35"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_36",
                    "name": "S36"
                }
            ]
        ]
    },
    "right": {
        "note": "",
        "vehicles": [
            [
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_37",
                    "name": "S37"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_38",
                    "name": "S38"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_39",
                    "name": "S39"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_40",
                    "name": "S40"
                }
            ],
            [
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_41",
                    "name": "S41"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_42",
                    "name": "S42"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_43",
                    "name": "S43"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_44",
                    "name": "S44"
                }
            ],
            [
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_45",
                    "name": "S45"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_46",
                    "name": "S46"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_47",
                    "name": "S47"
                },
                {
                    "type": "space",
                    "direction": "straight",
                    "id": "space_48",
                    "name": "S48"
                }
            ]
        ]
    }
}