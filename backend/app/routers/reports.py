from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Report, ReportStatus
from app.schemas import ReportCreate, ReportOut, ReportUpdate

router = APIRouter(prefix="/api", tags=["reports"])


@router.get("/reports", response_model=list[ReportOut])
def list_reports(status: ReportStatus | None = None, db: Session = Depends(get_db)):
    query = db.query(Report)
    if status is not None:
        query = query.filter(Report.status == status)
    return query.order_by(desc(Report.created_at)).all()


@router.get("/reports/{report_id}", response_model=ReportOut)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/reports", response_model=ReportOut, status_code=201)
def create_report(payload: ReportCreate, db: Session = Depends(get_db)):
    report = Report(category=payload.category, comment=payload.comment)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.patch("/reports/{report_id}", response_model=ReportOut)
@router.put("/reports/{report_id}", response_model=ReportOut)
def update_report(report_id: int, payload: ReportUpdate, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    if payload.category is not None:
        report.category = payload.category
    if payload.comment is not None:
        report.comment = payload.comment
    if payload.status is not None:
        report.status = payload.status

    db.commit()
    db.refresh(report)
    return report


@router.delete("/reports/{report_id}", status_code=204)
def delete_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(report)
    db.commit()
    return None
