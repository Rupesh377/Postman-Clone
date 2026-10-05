package com.rupesh.Postman.Clone.History;

import com.rupesh.Postman.Clone.Authentication.Entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestHistoryRepository extends JpaRepository<RequestHistory , Long> {
    Page<RequestHistory> findByUser(User user, Pageable pageable);
}
