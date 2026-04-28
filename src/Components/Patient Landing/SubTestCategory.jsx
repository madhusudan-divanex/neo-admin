import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../utils/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { deleteApiData, getApiData, securePostData, updateApiData } from "../../Services/api";
import base_url from "../../Services/baseUrl";

function SubTestCategory() {
    const [view, setView] = useState("table");
    const [saving, setSaving] = useState(false);
    const [subCatData, setSubCatData] = useState([])
    const [editingId, setEditingId] = useState()
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [form, setForm] = useState({
        name: "",
    });

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleImageChange = (file) => {
        setForm(prev => ({
            ...prev,
            icon: file,
            preview: URL.createObjectURL(file)
        }));
    };



    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);

            let data = { name:form.name };

            // ✅ EDIT CASE
            if (editingId) {
                data.subCatId = editingId;
            }

            const res = editingId ? await updateApiData('admin/sub-test-category', data) : await securePostData(
                "admin/sub-test-category",
                data
            );
            if(res.success){
                toast.success(res.message)
            }else{
                toast.error(res.message);
            }

            setView("table");
            fetchData();

        } catch (err) {
            console.log(err);
            toast.error("Failed");
        } finally {
            setSaving(false);
        }
    };

    // ✅ get data
    const fetchData = async () => {
        try {
            const res = await getApiData("admin/sub-test-category");
            if (res.success) {
                setSubCatData(res.data)
                setTotalPages(res.totalPages || 1);
                setPage(res.currentPage || 1);
            }



        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    const handleAdd = () => {
        setEditingId(null);
        setForm({
            icon: null,
            preview: "",
            name: "",
        });
        setView("form");
    }; const handleEdit = (item) => {
        setEditingId(item._id);

        setForm({
            // icon: item.icon,
            // preview: `${base_url}/${item.icon}`,
            name: item.name,
        });

        setView("form");
    };

    return (
        <div className="main-content flex-grow-1 p-3 overflow-auto">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="gradient-text">Sub Test Categories</h3>

                {view === "table" && (
                    <button className="thm-btn" onClick={handleAdd}>
                        + Add
                    </button>
                )}
            </div>
            {view === "table" && (
                <div className="new-mega-card p-4">
                    <div className="row mt-3 align-items-center" >


                        <div className="col-lg-2">Name</div>

                        <div className="col-lg-2">
                            Action
                        </div>

                    </div>
                    {subCatData?.map((item) => (
                        <div className="row mt-3 align-items-center" key={item._id}>

                           

                            <div className="col-lg-3">{item.name}</div>

                            <div className="col-lg-2">
                                <button className="btn btn-sm btn-outline-success me-2" onClick={() => handleEdit(item)}>
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>

                                {/* <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item._id)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button> */}
                            </div>

                        </div>
                    ))}

                </div>
            )}
            {view === "form" && (
                <form onSubmit={handleSubmit}>
                    <div className="new-mega-card p-4">

                        <div className="row">

                            <div className="col-lg-6">
                                <div className="custom-frm-bx">
                                    <label htmlFor="">Title</label>
                                    <input
                                        className="form-control nw-select-frm"
                                        placeholder="Name"
                                        value={form.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                    />
                                </div>
                            </div>



                           

                        </div>

                        <div className="d-flex justify-content-between mt-3">
                            <button type="button" onClick={() => setView("table")} className="nw-thm-btn outline">
                                Cancel
                            </button>

                            <button type="submit" className="nw-thm-btn">
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>

                    </div>
                </form>
            )}
        </div>
    );
}

export default SubTestCategory;