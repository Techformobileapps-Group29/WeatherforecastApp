import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import React, { useState, createRef, useCallback, useEffect } from "react";
import commonStyles from "../assets/CommonCss";
import { Feather, FontAwesome, Entypo } from "@expo/vector-icons";
import Axios from "axios";
import { debounce, get, set } from "lodash";
import * as Location from "expo-location";

const HomeScreen = () => {
  const [toggleSearch, setToggleSearch] = useState(false);
  const [searchLocation, setSearchLocation] = useState("");
  const [locations, setLocations] = useState([]);
  const [forecast, setForecast] = useState({});
  const [weather, setWeather] = useState<
    | {
        location: {
          name: string;
          region: string;
          country: string;
          lat: number;
          lon: number;
          tz_id: string;
        };
        current: {
          air_quality: {
            co: number;
            gb: number;
            no2: number;
            o3: number;
            pm10: number;
            pm2_5: number;
            so2: number;
            us_epa_index: number;
            gb_defra_index: number;
          };
          cloud: number;
          temp_c: number;
          condition: {
            icon: string;
            text: string;
          };
          feelslike_c: number;
          gust_kph: number;
          humidity: number;
          is_day: number;
          precip_mm: number;
          pressure_mb: number;
          uv: number;
          vis_km: number;
          wind_degree: number;
          wind_dir: string;
          wind_kph: number;
        };
      }
    | {}
  >({});
  const inputRef = createRef<TextInput>();
  const [loading, setLoading] = useState(true);

  const getLocations = async (search: String) => {
    await Axios.get(
      `https://api.weatherapi.com/v1/search.json?key=9c649598fed0458da0975210240602&q=${search}`
    )
      .then(({ data }) => {
        setLocations(data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync();
      let geoCode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }).then((data) => {
        if (data.length > 0) {
          const city = data[0]?.city ?? "";
          getForecast(city);
        }
      });
    })();
  }, []);

  const getForecast = async (loc: string) => {
    setLoading(true);
    await Axios.get(
      `https://api.weatherapi.com/v1/current.json?key=9c649598fed0458da0975210240602&q=${loc}&aqi=yes`
    )
      .then(({ data }) => {
        setWeather(data);
        setLocations([]);
      })
      .catch((error) => {
        setLoading(false);
        console.log("Weather failed!", error);
      });

    await Axios.get(
      `https://api.weatherapi.com/v1/forecast.json?key=9c649598fed0458da0975210240602&q=${loc}&days=5`
    )
      .then(({ data }) => {
        setLoading(false);
        setForecast(data.forecast);
        setLocations([]);
      })
      .catch((error) => {
        setLoading(false);
        console.log("Location failed!", error);
      });
  };

  const handleTextDebounce = useCallback(debounce(getLocations, 1200), []);

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="light-content" />
      <Image
        source={require("../assets/assets/bg.png")}
        blurRadius={70}
        style={styles.bgImage}
      />
      <SafeAreaView style={styles.container}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: toggleSearch
                ? "rgba(255,255,255,0.2)"
                : "transparent",
            },
          ]}
        >
          {toggleSearch && (
            <TextInput
              placeholder="Search"
              placeholderTextColor={"white"}
              style={styles.input}
              onChangeText={handleTextDebounce}
              keyboardAppearance="dark"
              keyboardType="default"
              returnKeyType="search"
              onSubmitEditing={() => console.log("search")}
              ref={inputRef}
            />
          )}
          <TouchableOpacity
            onPress={() => {
              setToggleSearch(!toggleSearch);
              inputRef.current?.focus();
            }}
          >
            <FontAwesome
              name="search"
              size={25}
              color="white"
              style={[
                styles.searchIcon,
                {
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                },
              ]}
            />
          </TouchableOpacity>
        </View>
        {locations.length > 0 && toggleSearch ? (
          <View style={styles.results}>
            {locations.map(
              (
                location: {
                  name: string;
                  country: string;
                  region: string;
                },
                index
              ) => {
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.card,
                      {
                        borderBottomColor: "rgba(255,255,255,0.2)",
                        borderBottomWidth:
                          index != locations.length - 1 ? 1 : 0,
                      },
                    ]}
                    onPress={() => {
                      getForecast(location.name);
                      setToggleSearch(false);
                    }}
                  >
                    <FontAwesome
                      name="map-marker"
                      size={20}
                      color="rgba(255, 255, 255, 0.5)"
                    />
                    <Text style={styles.locationText}>
                      {location?.name}, {location.region}, {location.country}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        ) : null}
        {!loading &&
        Object.keys(weather).length !== 0 &&
        Object.keys(forecast).length !== 0 ? (
          <View style={styles.weatherContainer}>
            <Text style={styles.name}>
              {(weather as any)?.location?.name},{" "}
              {(weather as any)?.location?.region},{" "}
              {(weather as any)?.location?.country}
            </Text>
            {(weather as any)?.current?.condition?.text === "Partly cloudy" ? (
              <Image
                source={require("../assets/assets/partlycloudy.png")}
                style={{ width: 100, height: 100 }}
              />
            ) : (weather as any)?.current?.condition?.text ===
              "Moderate rain" ? (
              <Image
                source={require("../assets/assets/moderaterain.png")}
                style={{ width: 100, height: 100 }}
              />
            ) : (weather as any)?.current?.condition?.text ===
              "Patchy rain possible" ? (
              <Image
                source={require("../assets/assets/moderaterain.png")}
                style={{ width: 100, height: 100 }}
              />
            ) : (weather as any)?.current?.condition?.text === "Sunny" ? (
              <Image
                source={require("../assets/assets/sun.png")}
                style={{ width: 100, height: 100 }}
              />
            ) : (weather as any)?.current?.condition?.text === "Clear" ? (
              <Image
                source={require("../assets/assets/sun.png")}
                style={{ width: 100, height: 100 }}
              />
            ) : (weather as any)?.current?.condition?.text === "Overcast" ? (
              <Image
                source={require("../assets/assets/cloud.png")}
                style={{ width: 100, height: 100 }}
              />
            ) : (weather as any)?.current?.condition?.text === "Cloudy" ? (
              <Image
                source={require("../assets/assets/cloud.png")}
                style={{ width: 100, height: 100 }}
              />
            ) : (weather as any)?.current?.condition?.text === "Light rain" ? (
              <Image
                source={require("../assets/assets/moderaterain.png")}
                style={{ width: 100, height: 100 }}
              />
            ) : (weather as any)?.current?.condition?.text ===
              "Moderate rain at times" ? (
              <Image
                source={require("../assets/assets/moderaterain.png")}
                style={{ width: 100, height: 100 }}
              />
            ) : (weather as any)?.current?.condition?.text === "Heavy rain" ? (
              <Image
                source={require("../assets/assets/heavyrain.png")}
                style={{ width: 100, height: 100 }}
              />
            ) : (weather as any)?.current?.condition?.text ===
              "Heavy rain at times" ? (
              <Image
                source={require("../assets/assets/heavyrain.png")}
                style={{ width: 100, height: 100 }}
              />
            ) : (weather as any)?.current?.condition?.text ===
              "Moderate or heavy freezing rain" ? (
              <Image
                source={require("../assets/assets/heavyrain.png")}
                style={{ width: 100, height: 100 }}
              />
            ) : (weather as any)?.current?.condition?.text ===
              "Moderate or heavy rain shower" ? (
              <Image
                source={require("../assets/assets/heavyrain.png")}
                style={{ width: 100, height: 100 }}
              />
            ) : (weather as any)?.current?.condition?.text ===
              "Moderate or heavy rain with thunder" ? (
              <Image
                source={require("../assets/assets/heavyrain.png")}
                style={{ width: 100, height: 100 }}
              />
            ) : (weather as any)?.current?.condition?.text === "Mist" ? (
              <Image
                source={require("../assets/assets/mist.png")}
                style={{ width: 100, height: 100 }}
              />
            ) : (
              <Image
                source={require("../assets/assets/moderaterain.png")}
                style={{ width: 100, height: 100 }}
              />
            )}

            <View style={styles.details2}>
              <Text style={styles.temp}>
                {Math.floor((weather as any)?.current?.temp_c)}°C (
                {(weather as any)?.current?.condition?.text})
              </Text>
              <Text style={styles.data2}>
                {Math.floor((forecast as any)?.forecastday[0]?.day?.mintemp_c)}
                °C /{" "}
                {Math.floor((forecast as any)?.forecastday[0]?.day?.maxtemp_c)}
                °C
              </Text>
              <Text style={styles.data3}>
                Real Feel {Math.floor((weather as any)?.current?.feelslike_c)}
                °C
              </Text>
              <View style={styles.details}>
                <Text style={styles.data}>
                  <Feather name="sunrise" size={18} color="white" />
                  {"  "}
                  {(forecast as any)?.forecastday[0]?.astro?.sunrise} |{"  "}
                </Text>
                <Text style={styles.data}>
                  <Feather name="sunset" size={18} color="white" />
                  {"  "}
                  {(forecast as any)?.forecastday[0]?.astro?.sunset}
                </Text>
              </View>
            </View>
            <View style={styles.details}>
              <Text style={styles.data}>
                <Feather name="sun" size={18} color="white" />
                {"  "}
                {(weather as any)?.current?.is_day === 1 ? "Day" : "Night"} |
                {"  "}
              </Text>
              <Text style={styles.data}>
                Air Quality:
                {(weather as any)?.current?.air_quality?.us_epa_index == 1
                  ? " Good"
                  : (weather as any)?.current?.air_quality?.us_epa_index == 2
                  ? " Moderate"
                  : (weather as any)?.current?.air_quality?.us_epa_index == 3
                  ? " Unhealthy"
                  : (weather as any)?.current?.air_quality?.us_epa_index == 4
                  ? " Unhealthy"
                  : (weather as any)?.current?.air_quality?.us_epa_index == 5
                  ? " Very Unhealthy"
                  : (weather as any)?.current?.air_quality?.us_epa_index == 6
                  ? " Hazardous"
                  : " Good"}{" "}
              </Text>
            </View>
            <View style={styles.details}>
              <Text style={styles.data}>
                <Feather name="wind" size={18} color="white" />{" "}
                {(weather as any)?.current?.wind_kph} km/h{" "}
                {(weather as any)?.current?.wind_dir} |{" "}
              </Text>
              <Text style={styles.data}>
                <Entypo name="water" size={18} color="white" />{" "}
                {(weather as any)?.current?.precip_mm}% |{" "}
              </Text>
              <Text style={styles.data}>
                <Feather name="cloud" size={18} color="white" />{" "}
                {(weather as any)?.current?.cloud}%
              </Text>
            </View>
            <View style={styles.details}></View>
            <Text style={styles.next}>
              <Entypo name="calendar" size={24} color="white" /> 5-Day Daily
              Forecast
            </Text>
            <ScrollView style={styles.carousel} horizontal>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                  marginTop: 10,
                }}
              >
                {forecast &&
                  (forecast as any)?.forecastday
                    .filter((day: any, index: number) => index != 0)
                    .map((day: any, index: number) => {
                      let date = new Date(day.date);
                      let options: Intl.DateTimeFormatOptions = {
                        weekday: "long",
                      };
                      let dayName = date.toLocaleDateString("en-US", options);
                      return (
                        <View
                          key={index}
                          style={{
                            backgroundColor: "rgba(255,255,255,0.3)",
                            padding: 10,
                            borderRadius: 20,
                            marginHorizontal: 5,
                            alignItems: "center",
                            aspectRatio: 1,
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ color: "white" }}>
                            {index == 0 ? "Tomorrow" : dayName.split(",")[0]}
                          </Text>
                          <Image
                            source={{
                              uri: `https:${day.day.condition.icon}`,
                            }}
                            style={{ width: 50, height: 50 }}
                          />
                          <Text style={{ color: "white" }}>
                            {Math.floor(day.day.mintemp_c)}°C /{" "}
                            {Math.floor(day.day.maxtemp_c)}°C
                          </Text>
                          <Text
                            style={{
                              color: "white",
                              textAlign: "center",
                              marginVertical: 5,
                            }}
                          >
                            {day.day.condition.text}
                          </Text>
                          <Text style={{ color: "white", textAlign: "center" }}>
                            <Feather name="sunrise" size={18} color="white" />
                            {"  "}
                            {day.astro.sunrise.split(" ")[0]} |{" "}
                            <Feather name="sunset" size={18} color="white" />
                            {"  "}
                            {day.astro.sunset.split(" ")[0]}
                          </Text>
                        </View>
                      );
                    })}
              </View>
            </ScrollView>
          </View>
        ) : (
          <ActivityIndicator size="large" color="white" />
        )}
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    position: "relative",
  },
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
  },
  bgImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  searchContainer: {
    justifyContent: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 20,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingRight: 0,
    width: "90%",
    alignSelf: "center",
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 45,
    color: "white",
  },
  searchIcon: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },
  results: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 20,
    width: "100%",
    marginTop: 10,
  },
  card: {
    padding: 15,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locationText: {
    color: "white",
    fontSize: 16,
  },
  weatherContainer: {
    flex: 1,
    alignItems: "center",
  },
  name: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 20,
  },
  name2: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    alignItems: "center",
  },
  temp: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 10,
  },
  details: {
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  data: {
    color: "white",
    fontSize: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  data2: {
    color: "white",
    fontSize: 18,
    justifyContent: "center",
    marginTop: 10,
  },
  data3: {
    color: "white",
    fontSize: 18,
    justifyContent: "center",
    marginBottom: 10,
  },
  details2: {
    justifyContent: "center",
    alignItems: "center",
  },
  carousel: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    width: "100%",
  },
  next: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
  },
});
