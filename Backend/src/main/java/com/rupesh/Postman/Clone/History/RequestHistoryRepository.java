package com.rupesh.Postman.Clone.History;

import com.rupesh.Postman.Clone.Authentication.Entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface RequestHistoryRepository extends JpaRepository<RequestHistory , Long> {
    Page<RequestHistory> findByUser(User user, Pageable pageable);

    Optional<RequestHistory> findByUserAndApiRequestId(User user, Long apiRequestId);

    long countByUser(User user);

    Optional<RequestHistory> findFirstByUserOrderByExecutedAtAsc(User user);
}
