import { Alert, MenuItem, Select, Slider, Snackbar } from "@mui/material";
import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { Chart } from "react-google-charts";
import { getCovidData, getCovidDataByDate } from "../services/getCovidData";
import style from "../styles/Home.module.css";

import { add, format } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useDebounce } from "../Hooks/useDebounce";

interface ICovidData {
  location: string;
  date: string;
  num_sequences_total: string;
  variant: string;
}
interface IProps {
  covidDates: string[];
  error: boolean;
}

interface IVariants {
  variant: string;
  value: string;
}

interface IAcumulator {
  date: string;
  location: string;
  variant: IVariants[];
}

const Home: NextPage<IProps> = ({ covidDates, error }) => {
  const [value, setValue] = useState("");
  const [data, setData] = useState<string[][] | never[]>([]);
  const [open, setOpen] = useState(error);
  const [valueSelect, setValueSelect] = useState(10);

  const numberDates = covidDates?.map((date) => new Date(date).getTime());

  const formatMark = (date: number) => {
    return `${format(new Date(date), "LLL", {
      locale: enUS,
    })}/${new Date(date).getFullYear()}`;
  };

  let maxDate = 0;
  let minDate = 0;
  let middleDate = 0;
  let betweenMinMiddleDate = 0;
  let betweenMiddleMaxDate = 0;
  let formatedMaxDate = "";
  let formatedMinDate = "";
  let formatedMiddleDate = "";
  let formatedbetweenMinMiddleDate = "";
  let formatedbetweenMiddleMaxDate = "";

  if (numberDates) {
    maxDate = Math.max(...numberDates);
    maxDate = new Date(
      add(new Date(maxDate), {
        days: 1,
      })
    ).getTime();
    minDate = Math.min(...numberDates);
    middleDate = (maxDate + minDate) / 2;
    betweenMinMiddleDate = (middleDate + minDate) / 2;
    betweenMiddleMaxDate = (maxDate + middleDate) / 2;

    formatedMaxDate = formatMark(maxDate);
    formatedMinDate = formatMark(minDate);
    formatedMiddleDate = formatMark(middleDate);
    formatedbetweenMinMiddleDate = formatMark(betweenMinMiddleDate);
    formatedbetweenMiddleMaxDate = formatMark(betweenMiddleMaxDate);
  }

  const changeMapValue = (isoFormat: string) => {
    if (valueSelect === 10) {
      getCovidDataByDate(isoFormat)
        .then((resp) => {
          if (!resp.length) {
            return setOpen(true);
          }

          const countrys = resp.map((item: ICovidData) => item.location);

          let covidData: ICovidData | any = [];

          const noDuplicateCountrys = countrys.filter(function (
            element: string,
            index: number
          ) {
            return countrys.indexOf(element) === index;
          });

          noDuplicateCountrys.forEach((country: string) => {
            const groupCountry = resp.filter(
              (covidData: ICovidData) => covidData.location === country
            );

            const formatedData = groupCountry.reduce(
              (acumulator: IAcumulator, current: ICovidData) => {
                acumulator.variant = [
                  ...acumulator.variant,
                  {
                    variant: current.variant,
                    value: current.num_sequences_total,
                  },
                ];

                acumulator = {
                  ...acumulator,
                  location: current.location,
                  date: current.date,
                };

                return acumulator;
              },
              { variant: [] }
            );

            covidData = [...covidData, formatedData];
          });

          const formatSchema = covidData.map((data: IAcumulator) => [
            data.location,
            `${data.variant.map(
              (variant: IVariants) => `${variant.variant}: ${variant.value}`
            )}`.replaceAll(",", "\n"),
          ]);

          formatSchema.unshift(["Country", "Cases"]);
          setData(formatSchema);
        })
        .catch(() => {
          return setOpen(true);
        });
    } /* else {
      const filterDates = covidDates.filter(
        (date) => new Date(date).getTime() <= new Date(isoFormat).getTime()
      );
      let test: any = [];
      getCovidData().then((resp) => {
        let test: any = [];
        resp.forEach((data: ICovidData) => {
          filterDates.forEach((date) => {
            if (data.date === date) {
              test = [...test, data];
            }
          });
        });

        console.log(test);
      });
    } */

    //nesse trecho de codigo seria implementada a função de puxar desde aquela data, porém isso consome muito processamento por serem muitos dados
    //infelizmente não achei uma maneira com JSON Server para puxar um intervalo de datas, por isso não implementei essa função
    //O API de copia no arquivo covid-data-copy.json pode ser usada para mostrar que esse console.log(test) funciona a partir dai seria só seguir o resto do fluxo
  };

  useEffect(() => {
    if (!error) {
      setValue(format(new Date(minDate), "P", { locale: ptBR }));

      const isoFormat = new Date(minDate).toISOString().substring(0, 10);

      changeMapValue(isoFormat);
    } else {
      setOpen(true);
    }
  }, []);

  const marks = [
    {
      value: minDate,
      label: formatedMinDate,
    },
    {
      value: betweenMinMiddleDate,
      label: formatedbetweenMinMiddleDate,
    },
    {
      value: middleDate,
      label: formatedMiddleDate,
    },
    {
      value: betweenMiddleMaxDate,
      label: formatedbetweenMiddleMaxDate,
    },
    {
      value: maxDate,
      label: formatedMaxDate,
    },
  ];

  const debounceRequest = useDebounce((time: number) => {
    const isoFormat = new Date(time).toISOString().substring(0, 10);

    changeMapValue(isoFormat);
  }, 300);

  const handleChange = (event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    setValue(format(new Date(value), "P", { locale: ptBR }));

    debounceRequest(value);
  };

  const handleChangeSelect = (value: number | string) => {
    if (typeof value === "string") {
      setValueSelect(parseInt(value));
    } else {
      setValueSelect(value);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (error) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Covid Daily Cases</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <h1 className={style.title}>Covid Daily Cases</h1>
        <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
          <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
            No data found
          </Alert>
        </Snackbar>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Covid Daily Cases</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={style.header}>
        <div></div>
        <h1>Covid Daily Cases</h1>
        <div>
          <Select
            value={valueSelect}
            onChange={(event) => {
              const value = event.target.value;
              handleChangeSelect(value);
            }}
          >
            <MenuItem value={10}>Just that date</MenuItem>
            <MenuItem value={20}>Until that date</MenuItem>
          </Select>
        </div>
      </div>
      <Slider
        className={style.slider}
        marks={marks}
        valueLabelDisplay="on"
        min={minDate}
        max={maxDate}
        onChange={(event) => {
          handleChange(event);
        }}
        valueLabelFormat={value}
      />

      <Chart chartType="GeoChart" width="100%" height="800px" data={data} />
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
          {error ? "No data found" : "that day doesn't have data"}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Home;

export async function getServerSideProps() {
  let error = false;
  const covidData = await getCovidData().catch(() => {
    error = true;
  });

  if (!error) {
    const justDates = covidData.map((data: ICovidData) => data.date);

    const noDuplicateDates = justDates.filter(function (
      element: ICovidData,
      index: number
    ) {
      return justDates.indexOf(element) === index;
    });

    return {
      props: {
        covidDates: noDuplicateDates,
      },
    };
  }

  return {
    props: {
      error: true,
    },
  };
}
