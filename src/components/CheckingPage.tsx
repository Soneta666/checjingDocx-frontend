import { Button, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, TextField } from "@mui/material";
import "./style.css"
import React from "react";
import http_common from "../http_common";

interface Requirement{
    id: number;
    name: string;
    getSearch: string;
    value: string;
}

interface Value{
    id: number;
    name: string;
    requirementId: number;
    requirement: Requirement;
}

const CheckingPage = () => {

    const [requirements, setRequirements] = React.useState<Requirement[]>([]);
    const [values, setValues] = React.useState<Value[]>([]);
    const [valuesId, setValuesId] = React.useState<Value[]>([]);
    const [resS, setResS] = React.useState<string[]>([]);
    const [file, setFile] = React.useState<Blob|string>('');
    const [fileName, setFileName] = React.useState<string>('');
    const [jsonStr, setJsonStr] = React.useState<string>('');

    React.useEffect(() => {
        http_common.get(`/api/Requirements`)
            .then(r => {
                let requirements: Requirement[] = [];
                requirements.push({id:2, name:"Розмір шрифту головного заголовка", getSearch:"Size", value:"Heading1"});
                requirements.push({id:2, name:"Розмір шрифту заголовків", getSearch:"Size", value:"Heading"});
                requirements.push(...r.data);
                console.log(requirements);
                setRequirements(requirements);
            })
            .catch(e => console.error(e));
        http_common.get(`/api/Values`)
            .then(r => {
                setValues(r.data);
            })
            .catch(e => console.error(e));
    }, []);


   const JsonForm = () => {
        let tmp:string = "[";
        valuesId.map((value, index) => {
            if(value != null){
                let str = "\n\t{\n\t\t\"requirements\":\""+requirements[index].name;
                str+= "\",\n\t\t\"value\":\""+value.name;
                if(requirements[index].value != undefined)
                    str+="\",\n\t\t\"styleName\":\""+requirements[index].value;
                str+="\"\n\t}"
                tmp += str;
            }
        })
        tmp+="\n]";
        setJsonStr(tmp);
    };

    const jsonClick = () => {
        let tmp1: boolean = false;
        let tmp2: boolean = false;
        let str: string = "";
        let list: string[][] = [];
        let index1: number = 0;
        for (let i = 0; i < jsonStr.length; i++) {
            if(jsonStr[i] == '{') { tmp1 = true; list.push([]); }
            else if(jsonStr[i] == '}'){ tmp1 = false; index1++;}
      
            if(tmp1){
                if(jsonStr[i] == '"'){
                    if(tmp2){
                        if(str != "requirements" && str != "value" && str != "styleName") 
                            list[index1].push(str);
                        str="";
                    }
                    tmp2 = !tmp2;
                }
                else if(tmp2){
                    str += jsonStr[i];
                }
            }
        }

        const updatedValuesId: string[] = [];
        const promises = list.map((value, index) => {
            console.log(value);
            const formData = new FormData();
            formData.append('file', file);
            if (value.length >= 2) {
                formData.append('value', value[1]);
                const tmp = requirements.find(r => r.name == value[0])?.getSearch;
    
                if(value.length == 3)
                    formData.append('styleName', value[2]);

                return http_common.post(`/api/Checking/checking${tmp}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
                .then(r => {
                    if(r.data == 'Є інші'){
                        return http_common.post(`/api/Checking/get${tmp}`, formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data'
                            }
                        })
                        .then(r2 => {
                            updatedValuesId[index] = value[0] + ":  " + r.data + "  " + r2.data;
                        })
                        .catch(e => console.error(e));
                    }
                    else{
                        updatedValuesId[index] = value[0] + ":  " + r.data;
                    }
                })
                .catch(e => console.error(e));
            } 
            else if(value.length == 1 && value[0] == "Рисунки"){
                return http_common.post('/api/Checking/Picture', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
                .then(response => {
                        updatedValuesId[index] = "Рисунки:  " + response.data;
                })
                .catch(e => console.error(e));
            
            }
            else {
                return Promise.resolve();
            }
        });
        Promise.all(promises).then(() => {
            setResS(updatedValuesId);
        });
    }


    const handleChange = (event: SelectChangeEvent, index:number) => {
        const id: number = Number(event.target.value);
        const newValue = values.find(value => value.id === id);
        if (newValue) {
            const updatedValuesId = [...valuesId];
            updatedValuesId[index] = newValue;
            setValuesId(updatedValuesId);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file1 = event.target.files?.[0];
        if (file1) {
            setFile(file1);
            setFileName(file1.name);
        }
    };

    const handleAvatarClick = () => {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.click();
        }
    };

    const CheckClick = () => {
        if(valuesId.length != 0){
            const updatedValuesId: string[] = [];
    
            const promises = valuesId.map((valueId, index) => {
                if (valueId != null) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('value', valueId.name);
                    const tmp = valueId.requirement.getSearch;
        
                    if(index == 0 || index == 1)
                        formData.append('styleName', requirements[index].value);

                    return http_common.post(`/api/Checking/checking${tmp}`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    })
                    .then(r => {
                        if(r.data == 'Є інші'){
                            return http_common.post(`/api/Checking/get${tmp}`, formData, {
                                headers: {
                                    'Content-Type': 'multipart/form-data'
                                }
                            })
                            .then(r2 => {
                                updatedValuesId[index] = requirements[index].name + ":  " + r.data + "  " + r2.data;
                            })
                            .catch(e => console.error(e));
                        }
                        else{
                            updatedValuesId[index] = requirements[index].name + ":  " + r.data;
                        }
                    })
                    .catch(e => console.error(e));
                } else {
                    return Promise.resolve();
                }
            });
            const formData = new FormData();
            formData.append('file', file);
            
            const additionalPromise = http_common.post('/api/Checking/Picture', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
                .then(response => {
                        updatedValuesId[requirements.length] = "Рисунки:  " + response.data;
                })
                .catch(e => console.error(e));
            
            promises.push(additionalPromise);

            Promise.all(promises).then(() => {
                setResS(updatedValuesId);
            });
        }
        else{
            const updatedValuesId: string[] = [];
    
            const promises = requirements.map((requirement, index) => {
                if (requirement != null) {
                    const formData = new FormData();
                    formData.append('file', file);
                    const tmp = requirement.getSearch;
        
                    if(index == 0 || index == 1)
                        formData.append('styleName', requirement.value);
                    
                    console.log(requirement);
                    return http_common.post(`/api/Checking/get${tmp}`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    })
                    .then(r => {
                        updatedValuesId[index] = requirements[index].name + ":  " + r.data;
                    })
                    .catch(e => console.error(e));
                } else {
                    return Promise.resolve();
                }
            });

            const formData = new FormData();
            formData.append('file', file);
            const additionalPromise = http_common.post('/api/Checking/Picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            .then(response => {
                    updatedValuesId[requirements.length] = "Рисунки:  " + response.data;
            })
            .catch(e => console.error(e));
        
            promises.push(additionalPromise);

            Promise.all(promises).then(() => {
                setResS(updatedValuesId);
            });
        }
    };

    return (
        <Stack justifyContent="center"
            sx={{marginY:"100px", width:"80%"}}>
        <Stack className="checkingPage"
            sx={{ margin:"10%", paddingX:"10%", paddingY: "5%", width:"80%"}}
            spacing={5} alignItems='center'>
                <Grid container spacing={2}>
                {requirements.map((requ, index) => (
                    <Grid item sm={6} md={6} lg={4} >
                         <FormControl sx={{width:'300px', background:"white"}}>
                            <InputLabel id={index.toString()}>{requ.name}</InputLabel>
                            <Select
                                labelId={index.toString()}
                                value={valuesId[index]?.id.toString()}
                                label={requ.name}
                                onChange={(event) => handleChange(event, index)}
                            >
                                {values.map((value) => (
                                    value.requirementId==requ.id ?
                                    <MenuItem value={value.id} key={value.id}>{value.name}</MenuItem>
                                    : <></>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                ))}
                </Grid>
            <div style={{position:'relative', cursor: 'pointer'}}
                onClick={handleAvatarClick}
            >
                <input
                    type="file"
                    id="fileInput"
                    accept="*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
                <div>{file != '' ? fileName : "Виберіть файл"}</div>
            </div>

            <Grid container>
                <Grid item xs={4}>
                    <Stack alignItems="center">
                        <Button onClick={jsonClick} sx={{background: "#a2d3b2"}} className="button">Перевірити json</Button>
                    </Stack>                    
                </Grid>
                <Grid item xs={4}>
                    <Stack alignItems="center">
                        <Button onClick={JsonForm} className="button">Сформувати json</Button>
                    </Stack>
                </Grid>
                <Grid item xs={4}>
                    <Stack alignItems="center">
                        <Button onClick={CheckClick} sx={{background: "#a2d3b2"}} className="button">Перевірити</Button>
                    </Stack>
                </Grid>
            </Grid>
        </Stack>
        <Grid container>
            <Grid item xs={6}>
                <TextField id="outlined-basic" multiline variant="outlined" value={jsonStr} 
                sx={{ marginX:"10%", paddingX:"10%", width:"80%"}}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setJsonStr(event.target.value);
                }}/>
            </Grid>
            <Grid item xs={6}>
                {resS.length != 0
                    ?<Stack alignItems="center" sx={{ marginX:"10%", paddingX:"10%", width:"80%"}} className="res">
                        <span className="text"> Результати </span>
                        {Array.isArray(resS) ? (
                            <Stack>
                                {resS.map((res, index) => (
                                    <Stack key={index}>{res}</Stack>
                                ))}
                            </Stack>
                        ) : (
                            <Stack>{resS}</Stack>
                        )}
                    </Stack>
                    :<></>}
            </Grid>
        </Grid>
        </Stack>
    );
}

export default CheckingPage;