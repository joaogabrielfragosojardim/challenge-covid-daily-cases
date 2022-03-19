import { Slider } from "@mui/material";
import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { Chart } from "react-google-charts";
import { getCovidData, getCovidDataByDate } from "../services/getCovidData";
import style from "../styles/Home.module.css";

import { add, format, formatISO } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { ChangeEvent, useEffect, useState } from "react";
import { useDebounce } from "../Hooks/useDebounce";

interface ICovidData {
  location: string;
  date: string;
  num_sequences_total: string;
  variant: string;
}
interface IProps {
  covidData: string[];
}

const Home: NextPage<IProps> = ({ covidData }) => {
  const [value, setValue] = useState("");
  const [data, setData] = useState<any>([]);

  const noDuplicateDates = covidData.filter(function (el, i) {
    return covidData.indexOf(el) === i;
  });

  const numberDates = noDuplicateDates.map((date) => new Date(date).getTime());

  const formatMark = (date: number) => {
    return `${format(new Date(date), "LLL", {
      locale: enUS,
    })}/${new Date(date).getFullYear()}`;
  };

  var maxDate = Math.max(...numberDates);
  maxDate = new Date(
    add(new Date(maxDate), {
      days: 1,
    })
  ).getTime();
  const minDate = Math.min(...numberDates);
  const middleDate = (maxDate + minDate) / 2;
  const betweenMinMiddleDate = (middleDate + minDate) / 2;
  const betweenMiddleMaxDate = (maxDate + middleDate) / 2;

  const formatedMaxDate = formatMark(maxDate);
  const formatedMinDate = formatMark(minDate);
  const formatedMiddleDate = formatMark(middleDate);
  const formatedbetweenMinMiddleDate = formatMark(betweenMinMiddleDate);
  const formatedbetweenMiddleMaxDate = formatMark(betweenMiddleMaxDate);

  const changeMapValue = (isoFormat: string) => {
    getCovidDataByDate(isoFormat)
      .then((resp) => {
        const countrys = resp.map((item: ICovidData) => item.location);

        let covidData: any = [];

        const noDuplicateCountrys = countrys.filter(function (
          el: string,
          i: number
        ) {
          return countrys.indexOf(el) === i;
        });

        noDuplicateCountrys.forEach((country: string) => {
          const groupCountry = resp.filter(
            (covidData: any) => covidData.location === country
          );

          const formatedData = groupCountry.reduce(
            (acumulator: any, current: any) => {
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

        const formatSchema = covidData.map((data: any) => [
          data.location,
          `${data.variant.map(
            (variant: any) => `${variant.variant}: ${variant.value}`
          )}`.replaceAll(",", "\n"),
        ]);

        formatSchema.unshift(["Country", "Cases"]);

        setData(formatSchema);
      })
      .catch(() => {
        console.log("erro");
      });
  };

  useEffect(() => {
    setValue(format(new Date(minDate), "P", { locale: ptBR }));

    const isoFormat = new Date(minDate).toISOString().substring(0, 10);

    changeMapValue(isoFormat);
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

  const handleChange = (event: any) => {
    setValue(format(new Date(event.target.value), "P", { locale: ptBR }));

    debounceRequest(event.target.value);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Covid Daily Cases</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1 className={style.title}>Covid Daily Cases</h1>
      <Slider
        className={style.slider}
        marks={marks}
        valueLabelDisplay="on"
        min={minDate}
        max={maxDate}
        onChange={(e) => {
          handleChange(e);
        }}
        valueLabelFormat={value}
      />

      <Chart chartType="GeoChart" width="100%" height="800px" data={data} />
    </div>
  );
};

export default Home;

export async function getServerSideProps() {
  const data = await getCovidData();
  return {
    props: {
      covidData: data.map((item: ICovidData) => item.date),
    },
  };
}
