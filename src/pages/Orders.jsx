import React from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useSidebar } from "../context/SidebarContext";
import { useOrders } from "../context/OrdersContext";
import OrderFilterButton from "../components/OrderFilterButtons";
import "./styles/orders.css";
import Footer from "../components/Footer";
import OrdersTable from "../components/OrderTable";

const Orders = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { collapsed } = useSidebar();
    const { orderType, setOrderType } = useOrders();
    const [isOpen, setIsOpen] = React.useState(false);
    const toggleSidebar = () => setIsOpen(!isOpen);

    console.log(orderType);

    return (
        <div className="orders-container">
            <Header toggleSidebar={toggleSidebar} />
            <Sidebar
                barStatus={isOpen ? "active-menu" : "inactive-menu"}
                orders="active"
            />
            <section className={`mainsection ${collapsed ? "collapsed" : ""}`}>
                <div className="top-buttons">
                    <OrderFilterButton
                        type="processing"
                        currentType={orderType}
                        onClick={setOrderType}
                    >
                        Processing
                    </OrderFilterButton>

                    <OrderFilterButton
                        type="delivered"
                        currentType={orderType}
                        onClick={setOrderType}
                    >
                        Delivered
                    </OrderFilterButton>

                    <OrderFilterButton
                        type="cancelled"
                        currentType={orderType}
                        onClick={setOrderType}
                    >
                        Cancelled
                    </OrderFilterButton>

                    {/* <OrderFilterButton
                        type="awaiting"
                        currentType={orderType}
                        onClick={setOrderType}
                    >
                        Payment Awaiting
                    </OrderFilterButton> */}
                </div>
                <div className="orders-table-section">
                    <OrdersTable orderType={orderType} />
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default Orders;
