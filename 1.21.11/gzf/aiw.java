import java.util.List;
import java.util.Optional;

public record aiw(int b, List<String> c, Optional<String> d) implements aay<aib> {
   public static final aao<wx, aiw> a;

   public aiw(int param1, List<String> param2, Optional<String> param3) {
      $$1 = List.copyOf($$1);
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
   }

   public aba<aiw> a() {
      return ahz.bK;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.b;
   }

   public List<String> e() {
      return this.c;
   }

   public Optional<String> f() {
      return this.d;
   }

   static {
      a = aao.a(aam.h, aiw::b, aam.b(1024).a(aam.c(100)), aiw::e, aam.b(32).a(aam::a), aiw::f, aiw::new);
   }
}
