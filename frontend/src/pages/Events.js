import React from "react";
import "./Events.css";
import Modal from "../components/Modal/Modal";
import Backdrop from "../components/Backdrop/Backdrop";
import AuthContext from "../context/auth-context";
import EventList from "../components/Events/EventList";
import Spinner from "../components/Spinner/Spinner";

const { useState, useCallback, createRef, useContext, useEffect } = React;

export default function EventsPage() {
  const [creating, setCreating] = useState(false);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const contextType = useContext(AuthContext);

  const titleElRef = createRef();
  const priceElRef = createRef();
  const dateElRef = createRef();
  const descriptionElRef = createRef();

  const fetchEvents = useCallback(() => {
    setIsLoading(true);
    const requestBody = {
      query: `
          query {
            events {
              _id
              title
              description
              date
              price
              creator {
                _id
                email
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
      },
    })
      .then((res) => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error("Failed");
        }
        return res.json();
      })
      .then((resData) => {
        const events = resData.data.events;
        setEvents(events);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setIsLoading(false);
      });
  }, []);

  const startCreateEventHandler = useCallback(() => {
    setCreating(true);
  }, [setCreating]);

  const modalCancelHandler = useCallback(() => {
    setCreating(false);
    setSelectedEvent(null);
  }, [setCreating, setSelectedEvent]);

  const modalConfirmHandler = useCallback(() => {
    setCreating(false);
    const title = titleElRef.current.value;
    const price = +priceElRef.current.value;
    const date = dateElRef.current.value;
    const description = descriptionElRef.current.value;

    if (
      title.trim().length === 0 ||
      price <= 0 ||
      date.trim().length === 0 ||
      description.trim().length === 0
    ) {
      return;
    }
    const event = { title, price, date, description };
    const requestBody = {
      query: `
          mutation {
            createEvent(eventInput: {title: "${title}", description: "${description}", price: ${price}, date: "${date}"}) {
              _id
              title
              description
              date
              price
            }
          }
        `,
    };

    const token = contextType.token;

    fetch("http://localhost:3500/graphql", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error("Failed");
        }
        return res.json();
      })
      .then((resData) => {
        // fetchEvents();
        setEvents((prevEvents) => {
          const newEvent = {
            _id: resData.data.createEvent._id,
            title: resData.data.createEvent.title,
            description: resData.data.createEvent.description,
            date: resData.data.createEvent.date,
            price: resData.data.createEvent.price,
            creator: {
              _id: contextType.userId,
            },
          };
          const updatedEvents = [...prevEvents, newEvent];
          return updatedEvents;
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }, [
    contextType.userId,
    setCreating,
    dateElRef,
    descriptionElRef,
    priceElRef,
    titleElRef,
    contextType.token,
  ]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const showDetailHandler = useCallback(
    (eventId) => {
      setSelectedEvent(() => {
        const selectedEvent = events.find((e) => e._id === eventId);
        return selectedEvent;
      });
    },
    [setSelectedEvent, events]
  );

  const bookEventHandler = useCallback(() => {}, []);

  return (
    <React.Fragment>
      {(creating || selectedEvent) && <Backdrop />}
      {creating && (
        <Modal
          title="Add Event"
          canCancel
          canConfirm
          onCancel={modalCancelHandler}
          onConfirm={modalConfirmHandler}
          confirmText="Confirm"
        >
          <form>
            <div className="form-control">
              <label htmlFor="title">Title</label>
              <input type="text" id="title" ref={titleElRef} />
            </div>
            <div className="form-control">
              <label htmlFor="price">Price</label>
              <input type="number" id="price" ref={priceElRef} />
            </div>
            <div className="form-control">
              <label htmlFor="date">Date</label>
              <input type="datetime-local" id="date" ref={dateElRef} />
            </div>
            <div className="form-control">
              <label htmlFor="description">Description</label>
              <textarea rows="4" id="description" ref={descriptionElRef} />
            </div>
          </form>
        </Modal>
      )}
      {selectedEvent && (
        <Modal
          title={selectedEvent.title}
          canCancel
          canConfirm
          onCancel={modalCancelHandler}
          onConfirm={bookEventHandler}
          confirmText="Book"
        >
          <h1>{selectedEvent.title}</h1>
          <h2>
            ${selectedEvent.price} -
            {new Date(selectedEvent.date).toLocaleDateString()}
          </h2>
          <p>{selectedEvent.description}</p>
        </Modal>
      )}
      {contextType.token && (
        <div className="events-control">
          <p>Share your own Events!</p>
          <button className="btn" onClick={startCreateEventHandler}>
            Create Event
          </button>
        </div>
      )}
      {isLoading ? (
        <Spinner />
      ) : (
        <EventList
          events={events}
          authUserId={contextType.userId}
          onViewDetail={showDetailHandler}
        />
      )}
    </React.Fragment>
  );
}
