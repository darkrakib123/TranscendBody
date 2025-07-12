// Shared modal utilities
function showConfirmationModal(message, onConfirm) {
    let modal = document.getElementById('confirmationModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'confirmationModal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Confirm Action</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="confirmationModalBody">${message}</div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="confirmationModalOk">OK</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        document.getElementById('confirmationModalBody').textContent = message;
    }
    const okBtn = document.getElementById('confirmationModalOk');
    okBtn.onclick = () => {
        bootstrap.Modal.getInstance(modal).hide();
        onConfirm();
    };
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
} 