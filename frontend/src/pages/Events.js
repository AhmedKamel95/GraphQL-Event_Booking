import React from "react";
import "./Events.css";
import Modal from "../components/Modal/Modal";
import Backdrop from "../components/Backdrop/Backdrop";
import AuthContext from "../context/auth-context";

const { useState, useCallback, createRef, useContext, useEffect } = React;

export default function EventsPage() {
  const [creating, setCreating] = useState(false);
  const [events, setEvents] = useState([]);

  const contextType = useContext(AuthContext);

  const titleElRef = createRef();
  const priceElRef = createRef();
  const dateElRef = createRef();
  const descriptionElRef = createRef();

  const fetchEvents = useCallback(() => {
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
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const startCreateEventHandler = useCallback(() => {
    setCreating(true);
  }, [setCreating]);

  const modalCancelHandler = useCallback(() => {
    setCreating(false);
  }, [setCreating]);

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
        fetchEvents();
      })
      .catch((err) => {
        console.log(err);
      });
  }, [
    setCreating,
    dateElRef,
    descriptionElRef,
    priceElRef,
    titleElRef,
    contextType.token,
    fetchEvents,
  ]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <React.Fragment>
      {creating && <Backdrop />}
      {creating && (
        <Modal
          title="Add Event"
          canCancel
          canConfirm
          onCacncel={modalCancelHandler}
          onConfirm={modalConfirmHandler}
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
      {contextType.token && (
        <div className="events-control">
          <p>Share your own Events!</p>
          <button className="btn" onClick={startCreateEventHandler}>
            Create Event
          </button>
        </div>
      )}
      <ul className="events__list">
        {events.map((event) => (
          <li key={event._id} className="events__list-item">
            {event.title}
          </li>
        ))}
      </ul>
    </React.Fragment>
  );
}
