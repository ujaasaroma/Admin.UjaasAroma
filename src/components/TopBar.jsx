import "./styles/TopBar.css";

const TopBar = (props) => {
    return (
        <div className="top-bar">
            <div className="search-add">
                <button
                    className="add-selected-btn"
                    style={{ width: props.addwidth, display: props.display }}
                    onClick={props.add}
                >
                    <small> Add New Product</small>
                </button>
                <input
                    type="text"
                    placeholder={props.searchBy}
                    value={props.search}
                    onChange={props.inpchange}
                />
            </div>
            <div className="filter-sort">
                {props.page === "queries" && (
                    <select value={props.sort} onChange={props.selchange}>
                        <option>Most Recent</option>
                        <option>Oldest First</option>
                    </select>
                )}
                {props.page === "products" && (<>
                    <select value={props.filter} onChange={props.filchange}>
                        <option>All</option>
                        <option>In Stock</option>
                        <option>Out of Stock</option>
                    </select>
                    <select value={props.sort} onChange={props.selchange}>
                        <option>Most Relevant</option>
                        <option>Price Lowest First</option>
                        <option>Price Highest First</option>
                    </select>
                </>
                )}
                {props.page === "users" && (
                    <>
                        <select value={props.filter} onChange={props.filchange}>
                            <option>All</option>
                            <option>Admins</option>
                            <option>Clients</option>
                        </select>
                        <select value={props.sort} onChange={props.selchange}>
                            <option>Most Relevant</option>
                            <option>Name A-Z</option>
                            <option>Name Z-A</option>
                            <option>Newest First</option>
                            <option>Oldest First</option>
                        </select>
                    </>
                )}

                {props.data > 0 && (
                    <button
                        className="delete-selected-btn"
                        style={{ width: props.delwidth }}
                        onClick={props.delete}
                    >
                        <small><i className="fa-solid fa-trash"></i></small>
                        <small> Delete ({props.length})</small>
                    </button>
                )}
            </div>
        </div>

    )
}

export default TopBar;