import React from "react";
import AuthContext from "../context/auth-context";
import Spinner from "../components/Spinner/Spinner";
import BookingList from "../components/Bookings/BookingList";

const { useCallback, useState, useEffect, useContext } = React;

const BookingsPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [bookings, setBookings] = useState([]);

  const contextType = useContext(AuthContext);

  const fetchBookings = useCallback(() => {
    setIsLoading(true);
    const requestBody = {
      query: `
          query {
            bookings {
              _id
              createdAt
              event { 
                _id
                title
                date
              }             
            }
          }
        `,
    };

    fetch("http://localhost:3500/graphql", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + contextType.token,
      },
    })
      .then((res) => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error("Failed");
        }
        return res.json();
      })
      .then((resData) => {
        const bookings = resData.data.bookings;
        setBookings(bookings);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setIsLoading(false);
      });
  }, [contextType]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const deleteBookingHandler = useCallback(
    (bookingId) => {
      setIsLoading(true);
      const requestBody = {
        query: `
          mutation CancelBooking($id: ID!) {
            cancelBooking(bookingId: $id) {
              _id
              title          
            }
          }
        `,
        variables: {
          id: bookingId,
        },
      };

      fetch("http://localhost:3500/graphql", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + contextType.token,
        },
      })
        .then((res) => {
          if (res.status !== 200 && res.status !== 201) {
            throw new Error("Failed");
          }
          return res.json();
        })
        .then((resData) => {
          setBookings((prevBookings) => {
            const updatedBookings = prevBookings.filter(
              (booking) => booking._id !== bookingId
            );
            return updatedBookings;
          });
          setIsLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setIsLoading(false);
        });
    },
    [contextType.token]
  );

  return (
    <React.Fragment>
      {isLoading ? (
        <Spinner />
      ) : (
        <BookingList bookings={bookings} onDelete={deleteBookingHandler} />
      )}
    </React.Fragment>
  );
};

export default BookingsPage;
